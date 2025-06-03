import { supabase } from "./supabase"

export class MigrationService {
  /**
   * Analyser tous les dossiers de location pour trouver les URLs blob temporaires
   */
  static async analyzeBlobUrls(): Promise<{
    totalFiles: number
    blobUrls: string[]
    validUrls: string[]
    filesToMigrate: number
  }> {
    try {
      console.log("🔍 Analyse des URLs blob...")

      const { data: rentalFiles, error } = await supabase.from("rental_files").select("*")

      if (error) {
        throw error
      }

      const allUrls: string[] = []
      const blobUrls: string[] = []
      const validUrls: string[] = []

      // Extraire toutes les URLs des dossiers
      for (const file of rentalFiles || []) {
        const extractUrls = (obj: any, path = ""): void => {
          if (!obj) return

          if (typeof obj === "string" && obj.startsWith("http")) {
            allUrls.push(obj)
            if (obj.includes("blob:")) {
              blobUrls.push(obj)
            } else {
              validUrls.push(obj)
            }
          } else if (Array.isArray(obj)) {
            obj.forEach((item, index) => extractUrls(item, `${path}[${index}]`))
          } else if (typeof obj === "object") {
            Object.keys(obj).forEach((key) => extractUrls(obj[key], `${path}.${key}`))
          }
        }

        extractUrls(file)
      }

      console.log("📊 Analyse terminée:", {
        totalFiles: allUrls.length,
        blobUrls: blobUrls.length,
        validUrls: validUrls.length,
      })

      return {
        totalFiles: allUrls.length,
        blobUrls,
        validUrls,
        filesToMigrate: blobUrls.length,
      }
    } catch (error) {
      console.error("❌ Erreur analyse:", error)
      throw error
    }
  }

  /**
   * Remplacer les URLs blob par des placeholders informatifs
   */
  static async replaceBlobUrls(): Promise<{
    filesUpdated: number
    urlsReplaced: number
  }> {
    try {
      console.log("🔄 Remplacement des URLs blob...")

      const { data: rentalFiles, error } = await supabase.from("rental_files").select("*")

      if (error) {
        throw error
      }

      let filesUpdated = 0
      let urlsReplaced = 0

      for (const file of rentalFiles || []) {
        let hasChanges = false
        const updatedFile = JSON.parse(JSON.stringify(file))

        const replaceUrls = (obj: any): any => {
          if (!obj) return obj

          if (typeof obj === "string" && obj.includes("blob:")) {
            urlsReplaced++
            hasChanges = true
            return "DOCUMENT_MIGRE_PLACEHOLDER"
          } else if (Array.isArray(obj)) {
            return obj.map((item) => replaceUrls(item))
          } else if (typeof obj === "object") {
            const newObj = {}
            Object.keys(obj).forEach((key) => {
              newObj[key] = replaceUrls(obj[key])
            })
            return newObj
          }

          return obj
        }

        // Remplacer dans main_tenant
        if (updatedFile.main_tenant) {
          updatedFile.main_tenant = replaceUrls(updatedFile.main_tenant)
        }

        // Remplacer dans cotenants
        if (updatedFile.cotenants) {
          updatedFile.cotenants = replaceUrls(updatedFile.cotenants)
        }

        // Remplacer dans guarantors
        if (updatedFile.guarantors) {
          updatedFile.guarantors = replaceUrls(updatedFile.guarantors)
        }

        // Mettre à jour si des changements ont été faits
        if (hasChanges) {
          const { error: updateError } = await supabase.from("rental_files").update(updatedFile).eq("id", file.id)

          if (updateError) {
            console.error("❌ Erreur mise à jour:", updateError)
          } else {
            filesUpdated++
            console.log("✅ Fichier mis à jour:", file.id)
          }
        }
      }

      console.log("🎉 Migration terminée:", { filesUpdated, urlsReplaced })

      return { filesUpdated, urlsReplaced }
    } catch (error) {
      console.error("❌ Erreur migration:", error)
      throw error
    }
  }

  /**
   * Créer un rapport de migration
   */
  static async generateMigrationReport(): Promise<any> {
    try {
      const analysis = await this.analyzeBlobUrls()

      return {
        timestamp: new Date().toISOString(),
        analysis,
        recommendations: [
          "Remplacer les URLs blob par des placeholders",
          "Informer les utilisateurs de re-uploader leurs documents",
          "Utiliser le nouveau système Supabase Storage",
          "Nettoyer les anciens fichiers temporaires",
        ],
        nextSteps: [
          "Exécuter replaceBlobUrls()",
          "Migrer les formulaires vers SupabaseFileUpload",
          "Tester le nouveau système d'upload",
          "Informer les utilisateurs",
        ],
      }
    } catch (error) {
      console.error("❌ Erreur rapport:", error)
      throw error
    }
  }
}
