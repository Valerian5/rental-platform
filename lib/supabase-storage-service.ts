import { supabase } from "./supabase"

export const SupabaseStorageService = {
  async uploadFile(
    file: File,
    bucket = "documents",
    folder = "general",
  ): Promise<{ url: string; path: string; size: number; uploadedAt: Date }> {
    try {
      console.log("📤 Upload fichier:", file.name, "vers", bucket, "/", folder)

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const extension = file.name.split(".").pop()?.toLowerCase()
      const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

      console.log("📝 Chemin généré:", filename)

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage.from(bucket).upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("❌ Erreur upload Supabase:", error)
        throw new Error(`Erreur upload: ${error.message}`)
      }

      console.log("✅ Fichier uploadé:", data.path)

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename)

      if (!urlData.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique")
      }

      console.log("🔗 URL publique:", urlData.publicUrl)

      return {
        url: urlData.publicUrl,
        path: data.path,
        size: file.size,
        uploadedAt: new Date(),
      }
    } catch (error) {
      console.error("❌ Erreur upload:", error)
      throw new Error(`Erreur lors de l'upload: ${error.message}`)
    }
  },

  async uploadFiles(files: File[], bucket = "documents", folder = "general"): Promise<any[]> {
    console.log("📤 Upload multiple:", files.length, "fichiers")

    const results = []
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, bucket, folder)
        results.push(result)
      } catch (error) {
        console.error("❌ Erreur upload fichier:", file.name, error)
        // Continuer avec les autres fichiers
      }
    }

    console.log("✅ Upload terminé:", results.length, "fichiers uploadés")
    return results
  },

  async deleteFile(path: string, bucket = "documents"): Promise<boolean> {
    try {
      console.log("🗑️ Suppression fichier:", path)

      const { error } = await supabase.storage.from(bucket).remove([path])

      if (error) {
        console.error("❌ Erreur suppression:", error)
        return false
      }

      console.log("✅ Fichier supprimé")
      return true
    } catch (error) {
      console.error("❌ Erreur suppression:", error)
      return false
    }
  },

  async listFiles(bucket = "documents", folder?: string): Promise<any[]> {
    try {
      console.log("📋 Listage fichiers, bucket:", bucket, "dossier:", folder)

      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit: 100,
        offset: 0,
      })

      if (error) {
        console.error("❌ Erreur listage:", error)
        return []
      }

      console.log("✅ Fichiers trouvés:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur listage:", error)
      return []
    }
  },

  async fileExists(path: string, bucket = "documents"): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path.split("/").slice(0, -1).join("/"))

      if (error) return false

      const filename = path.split("/").pop()
      return data?.some((file) => file.name === filename) || false
    } catch (error) {
      console.error("❌ Erreur vérification fichier:", error)
      return false
    }
  },

  async getFileInfo(url: string): Promise<any> {
    try {
      const response = await fetch(url, { method: "HEAD" })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return {
        url,
        size: response.headers.get("content-length"),
        type: response.headers.get("content-type"),
        lastModified: response.headers.get("last-modified"),
        exists: true,
      }
    } catch (error) {
      console.error("❌ Erreur info fichier:", error)
      return {
        url,
        exists: false,
        error: error.message,
      }
    }
  },

  getPublicUrl(path: string, bucket = "documents"): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async createSignedUrl(path: string, bucket = "documents", expiresIn = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

      if (error) {
        throw error
      }

      return data.signedUrl
    } catch (error) {
      console.error("❌ Erreur création URL signée:", error)
      throw error
    }
  },
}
