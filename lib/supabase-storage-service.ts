import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export const SupabaseStorageService = {
  async uploadFile(file: File, bucket = "property-images", folder = "general") {
    console.log("📤 Upload vers Supabase:", file.name, "dans", bucket, folder)
    console.log("📄 Type MIME:", file.type, "Taille:", file.size)

    try {
      // Liste des buckets disponibles par ordre de préférence
      const bucketFallbacks = [
        bucket, // Bucket demandé
        "property-documents", // Fallback principal
        "documents", // Fallback secondaire
        "property-images", // Fallback final
      ]

      let uploadResult = null
      let usedBucket = null

      // Essayer chaque bucket jusqu'à ce qu'un fonctionne
      for (const targetBucket of bucketFallbacks) {
        try {
          console.log("🪣 Tentative upload vers:", targetBucket)

          // Générer un nom de fichier unique
          const fileExt = file.name.split(".").pop()
          const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

          // Upload vers Supabase Storage
          const { data, error } = await supabase.storage.from(targetBucket).upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          })

          if (error) {
            console.warn(`⚠️ Échec upload vers ${targetBucket}:`, error.message)
            continue // Essayer le bucket suivant
          }

          // Obtenir l'URL publique
          const {
            data: { publicUrl },
          } = supabase.storage.from(targetBucket).getPublicUrl(fileName)

          uploadResult = {
            url: publicUrl,
            path: fileName,
            bucket: targetBucket,
          }
          usedBucket = targetBucket
          break // Upload réussi, sortir de la boucle
        } catch (bucketError) {
          console.warn(`⚠️ Erreur bucket ${targetBucket}:`, bucketError)
          continue // Essayer le bucket suivant
        }
      }

      if (!uploadResult) {
        throw new Error("Impossible d'uploader le fichier vers aucun bucket disponible")
      }

      console.log("✅ Upload réussi vers", usedBucket, ":", uploadResult.url)
      return uploadResult
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

  // Fonction pour vérifier les buckets disponibles
  async getAvailableBuckets() {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()

      if (error) {
        console.error("❌ Erreur liste buckets:", error)
        return ["property-documents", "documents", "property-images"] // Fallback
      }

      const bucketNames = buckets?.map((bucket) => bucket.name) || []
      console.log("🪣 Buckets disponibles:", bucketNames)
      return bucketNames
    } catch (error) {
      console.error("❌ Erreur vérification buckets:", error)
      return ["property-documents", "documents", "property-images"] // Fallback
    }
  },
}
