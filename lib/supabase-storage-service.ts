import { supabase } from "./supabase"
import { v4 as uuidv4 } from "uuid"

export const SupabaseStorageService = {
  async uploadFile(file: File, bucket: string, folder = "general"): Promise<{ url: string }> {
    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Upload du fichier
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file)

      if (error) {
        console.error("❌ Erreur upload Supabase:", error)
        throw new Error(`Erreur upload: ${JSON.stringify(error)}`)
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      return { url: urlData.publicUrl }
    } catch (error) {
      console.error("❌ Erreur service upload:", error)
      throw error
    }
  },

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extraire le bucket et le chemin de l'URL
      const url = new URL(fileUrl)
      const pathParts = url.pathname.split("/")
      
      // Format attendu: /storage/v1/object/public/bucket-name/path/to/file.ext
      const bucket = pathParts[5]
      const filePath = pathParts.slice(6).join("/")

      if (!bucket || !filePath) {
        throw new Error("Format d'URL invalide")
      }

      const { error } = await supabase.storage.from(bucket).remove([filePath])

      if (error) {
        console.error("❌ Erreur suppression fichier:", error)
        throw new Error(`Erreur suppression: ${JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error("❌ Erreur service deleteFile:", error)
      throw error
    }
  },

  /**
   * Upload multiple fichiers
   */
  static async uploadFiles(files: File[], bucket = "documents", folder = "general"): Promise<any[]> {
    console.log("📤 Upload multiple:", files.length, "fichiers")

    const results = []
    for (const file of files) {
      try {
        // @ts-ignore
        const result = await this.uploadFile(file, bucket, folder)
        results.push(result)
      } catch (error) {
        console.error("❌ Erreur upload fichier:", file.name, error)
        // Continuer avec les autres fichiers
      }
    }

    console.log("✅ Upload terminé:", results.length, "fichiers uploadés")
    return results
  }

  /**
   * Lister les fichiers
   */
  static async listFiles(bucket = "documents", folder?: string): Promise<any[]> {
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
  }

  /**
   * Vérifier si un fichier existe
   */
  static async fileExists(path: string, bucket = "documents"): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path.split("/").slice(0, -1).join("/"))

      if (error) return false

      const filename = path.split("/").pop()
      return data?.some((file) => file.name === filename) || false
    } catch (error) {
      console.error("❌ Erreur vérification fichier:", error)
      return false
    }
  }

  /**
   * Obtenir les informations d'un fichier
   */
  static async getFileInfo(url: string): Promise<any> {
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
  }

  /**
   * Obtenir l'URL publique d'un fichier
   */
  static getPublicUrl(path: string, bucket = "documents"): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  /**
   * Créer une URL de téléchargement signée (pour fichiers privés)
   */
  static async createSignedUrl(path: string, bucket = "documents", expiresIn = 3600): Promise<string> {
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
  }
}
