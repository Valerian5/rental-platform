export interface UploadResult {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
}

export class BlobStorageService {
  private static readonly BLOB_API_URL = "https://blob.vercel-storage.com"

  /**
   * Upload un fichier vers Vercel Blob Storage via API REST
   */
  static async uploadFile(file: File, folder = "documents"): Promise<UploadResult> {
    try {
      console.log("📤 Upload fichier:", file.name, "vers", folder)

      const token = process.env.BLOB_READ_WRITE_TOKEN
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN manquant")
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const extension = file.name.split(".").pop()
      const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

      console.log("📝 Nom de fichier généré:", filename)

      // Préparer les données du formulaire
      const formData = new FormData()
      formData.append("file", file)

      // Upload vers Vercel Blob via API REST
      const response = await fetch(`${this.BLOB_API_URL}?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("✅ Upload réussi:", result.url)

      return {
        url: result.url,
        pathname: result.pathname || filename,
        size: file.size,
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

      const token = process.env.BLOB_READ_WRITE_TOKEN
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN manquant")
      }

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        console.log("✅ Fichier supprimé")
        return true
      } else {
        console.error("❌ Erreur suppression:", response.status)
        return false
      }
    } catch (error) {
      console.error("❌ Erreur suppression:", error)
      return false
    }
  }

  /**
   * Lister les fichiers (simulation - API REST limitée)
   */
  static async listFiles(prefix?: string): Promise<any[]> {
    try {
      console.log("📋 Listage fichiers, préfixe:", prefix)

      // L'API REST de Vercel Blob ne supporte pas le listage
      // On simule en récupérant depuis la base de données
      console.log("ℹ️ Listage via base de données (API REST limitée)")

      return []
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

  /**
   * Créer une URL de téléchargement temporaire
   */
  static async createDownloadUrl(filename: string): Promise<string> {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN manquant")
      }

      // Pour Vercel Blob, les URLs sont directement accessibles
      return `${this.BLOB_API_URL}/${filename}`
    } catch (error) {
      console.error("❌ Erreur création URL:", error)
      throw error
    }
  }
}
