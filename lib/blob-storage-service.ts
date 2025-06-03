import { put, del, list } from "@vercel/blob"

export interface UploadResult {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
}

export class BlobStorageService {
  /**
   * Upload un fichier vers Vercel Blob Storage
   */
  static async uploadFile(file: File, folder = "documents"): Promise<UploadResult> {
    try {
      console.log("📤 Upload fichier:", file.name, "vers", folder)

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const extension = file.name.split(".").pop()
      const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

      console.log("📝 Nom de fichier généré:", filename)

      // Upload vers Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      })

      console.log("✅ Upload réussi:", blob.url)

      return {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: new Date(),
      }
    } catch (error) {
      console.error("❌ Erreur upload:", error)
      throw new Error(`Erreur lors de l'upload: ${error.message}`)
    }
  }

  /**
   * Upload multiple fichiers
   */
  static async uploadFiles(files: File[], folder = "documents"): Promise<UploadResult[]> {
    console.log("📤 Upload multiple:", files.length, "fichiers")

    const results = []
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, folder)
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
   * Supprimer un fichier
   */
  static async deleteFile(url: string): Promise<boolean> {
    try {
      console.log("🗑️ Suppression fichier:", url)
      await del(url)
      console.log("✅ Fichier supprimé")
      return true
    } catch (error) {
      console.error("❌ Erreur suppression:", error)
      return false
    }
  }

  /**
   * Lister les fichiers
   */
  static async listFiles(prefix?: string): Promise<any[]> {
    try {
      console.log("📋 Listage fichiers, préfixe:", prefix)
      const result = await list({ prefix })
      console.log("✅ Fichiers trouvés:", result.blobs.length)
      return result.blobs
    } catch (error) {
      console.error("❌ Erreur listage:", error)
      return []
    }
  }

  /**
   * Vérifier si un fichier existe
   */
  static async fileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: "HEAD" })
      return response.ok
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
}
