import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export const SupabaseStorageService = {
  async uploadFile(file: File, bucket = "property-images", folder = "general") {
    console.log("📤 Upload vers Supabase:", file.name, "dans", bucket, folder)

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("❌ Erreur Supabase upload:", error)
        throw error
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName)

      console.log("✅ Upload réussi:", publicUrl)

      return {
        url: publicUrl,
        path: fileName,
        bucket,
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
}
