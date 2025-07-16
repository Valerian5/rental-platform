import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export const SupabaseStorageService = {
  async uploadFile(file: File, bucket = "property-images", folder = "general") {
    console.log("📤 Upload vers Supabase:", file.name, "dans", bucket, folder)
    console.log("📄 Type MIME:", file.type, "Taille:", file.size)

    try {
      // Vérifier si le bucket existe, sinon utiliser un bucket par défaut
      const availableBuckets = ["property-images", "property-documents", "documents", "lease-annexes"]
      const targetBucket = availableBuckets.includes(bucket) ? bucket : "property-documents"

      console.log("🪣 Bucket cible:", targetBucket)

      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload vers Supabase Storage avec options étendues
      const { data, error } = await supabase.storage.from(targetBucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      })

      if (error) {
        console.error("❌ Erreur Supabase upload:", error)
        console.error("📄 Détails fichier:", { name: file.name, type: file.type, size: file.size })

        // Si le bucket n'existe pas, essayer avec le bucket par défaut
        if (error.message?.includes("Bucket not found") && targetBucket !== "property-documents") {
          console.log("🔄 Tentative avec bucket par défaut: property-documents")
          return await this.uploadFile(file, "property-documents", folder)
        }

        throw error
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from(targetBucket).getPublicUrl(fileName)

      console.log("✅ Upload réussi:", publicUrl)

      return {
        url: publicUrl,
        path: fileName,
        bucket: targetBucket,
      }
    } catch (error) {
      console.error("❌ Erreur upload:", error)
      throw error
    }
  },

  async uploadFiles(files: File[], bucket = "documents", folder = "general") {
    console.log("📤 Upload multiple:", files.length, "fichiers")

    const results = []
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, bucket, folder)
        results.push(result)
      } catch (error) {
        console.error("❌ Erreur upload fichier:", file.name, error)
        results.push({ error: error.message, fileName: file.name })
      }
    }

    return results
  },

  async deleteFile(path: string, bucket = "property-images") {
    console.log("🗑️ Suppression fichier:", path)

    try {
      const { error } = await supabase.storage.from(bucket).remove([path])

      if (error) {
        console.error("❌ Erreur suppression:", error)
        throw error
      }

      console.log("✅ Fichier supprimé:", path)
      return { success: true }
    } catch (error) {
      console.error("❌ Erreur suppression:", error)
      throw error
    }
  },

  async listFiles(folder = "", bucket = "property-images") {
    console.log("📋 Liste fichiers:", folder)

    try {
      const { data, error } = await supabase.storage.from(bucket).list(folder)

      if (error) {
        console.error("❌ Erreur liste:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("❌ Erreur liste:", error)
      throw error
    }
  },

  getPublicUrl(path: string, bucket = "property-images") {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  },

  // Fonction pour créer un bucket s'il n'existe pas
  async ensureBucketExists(bucketName: string) {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()

      if (error) {
        console.error("❌ Erreur liste buckets:", error)
        return false
      }

      const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

      if (!bucketExists) {
        console.log("🪣 Création du bucket:", bucketName)

        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ],
        })

        if (createError) {
          console.error("❌ Erreur création bucket:", createError)
          return false
        }

        console.log("✅ Bucket créé:", bucketName)
      }

      return true
    } catch (error) {
      console.error("❌ Erreur vérification bucket:", error)
      return false
    }
  },
}
