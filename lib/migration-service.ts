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

      // Analyser uniquement la table rental_files
      const { data: rentalFiles, error } = await supabase.from("rental_files").select("*")

      if (error) {
        console.error("❌ Erreur rental_files:", error)
        throw error
      }

      const allUrls: string[] = []
      const blobUrls: string[] = []
      const validUrls: string[] = []

      // Fonction pour extraire les URLs récursivement
      const extractUrls = (obj: any, path = ""): void => {
        if (!obj) return

        if (typeof obj === "string" && obj.startsWith("http")) {
          allUrls.push(obj)
          if (obj.includes("blob:")) {
            blobUrls.push(obj)
            console.log("🔍 URL blob trouvée:", obj, "dans", path)
          } else {
            validUrls.push(obj)
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, index) => extractUrls(item, `${path}[${index}]`))
        } else if (typeof obj === "object") {
          Object.keys(obj).forEach((key) => extractUrls(obj[key], `${path}.${key}`))
        }
      }

      // Analyser rental_files
      console.log("📋 Analyse de rental_files:", rentalFiles?.length || 0, "entrées")
      for (const file of rentalFiles || []) {
        extractUrls(file, `rental_files.${file.id}`)
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

      let filesUpdated = 0
      let urlsReplaced = 0

      // Traiter uniquement rental_files
      const { data: rentalFiles, error } = await supabase.from("rental_files").select("*")

      if (error) {
        console.error("❌ Erreur récupération rental_files:", error)
        throw error
      }

      for (const file of rentalFiles || []) {
        let hasChanges = false
        const updatedFile = JSON.parse(JSON.stringify(file))

        const replaceUrls = (obj: any): any => {
          if (!obj) return obj

          if (typeof obj === "string" && obj.includes("blob:")) {
            urlsReplaced++
            hasChanges = true
            console.log("🔄 Remplacement URL blob:", obj)
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

        // Remplacer dans tous les champs
        Object.keys(updatedFile).forEach((key) => {
          if (key !== "id" && key !== "created_at" && key !== "updated_at") {
            updatedFile[key] = replaceUrls(updatedFile[key])
          }
        })

        // Mettre à jour si des changements ont été faits
        if (hasChanges) {
          const { error: updateError } = await supabase.from("rental_files").update(updatedFile).eq("id", file.id)

          if (updateError) {
            console.error("❌ Erreur mise à jour rental_files:", updateError)
          } else {
            filesUpdated++
            console.log("✅ rental_files mis à jour:", file.id)
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

  /**
   * Nettoyer complètement un dossier de location (pour les tests)
   */
  static async cleanRentalFile(tenantId: string): Promise<void> {
    try {
      console.log("🧹 Nettoyage du dossier pour tenant:", tenantId)

      // Supprimer uniquement de rental_files
      const { error } = await supabase.from("rental_files").delete().eq("tenant_id", tenantId)

      if (error) {
        console.error("❌ Erreur suppression rental_files:", error)
        throw error
      } else {
        console.log("✅ rental_files nettoyé")
      }

      console.log("🎉 Nettoyage terminé pour tenant:", tenantId)
    } catch (error) {
      console.error("❌ Erreur nettoyage:", error)
      throw error
    }
  }
}
