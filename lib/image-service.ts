import { SupabaseStorageService } from "./supabase-storage-service"
import { supabase } from "./supabase"

export const imageService = {
  async uploadPropertyImage(file: File, propertyId: string): Promise<string> {
    console.log("📤 Upload image pour propriété:", propertyId)

    try {
      // Upload vers Supabase Storage
      const result = await SupabaseStorageService.uploadFile(file, "property-images", `properties/${propertyId}`)

      console.log("✅ Image uploadée:", result.url)
      return result.url
    } catch (error) {
      console.error("❌ Erreur dans uploadPropertyImage:", error)
      throw new Error(`Erreur upload image: ${error.message}`)
    }
  },

  async savePropertyImageMetadata(propertyId: string, imageUrl: string, isPrimary = false) {
    console.log("💾 Sauvegarde métadonnées image:", { propertyId, imageUrl, isPrimary })

    try {
      const { data, error } = await supabase
        .from("property_images")
        .insert({
          property_id: propertyId,
          url: imageUrl,
          is_primary: isPrimary,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur sauvegarde métadonnées:", error)
        throw error
      }

      console.log("✅ Métadonnées sauvegardées:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans savePropertyImageMetadata:", error)
      throw error
    }
  },

  async deletePropertyImage(imageId: string, imageUrl: string) {
    console.log("🗑️ Suppression image:", { imageId, imageUrl })

    try {
      // Supprimer de la base de données
      const { error: dbError } = await supabase.from("property_images").delete().eq("id", imageId)

      if (dbError) {
        console.error("❌ Erreur suppression DB:", dbError)
        throw dbError
      }

      // Extraire le chemin du fichier depuis l'URL
      try {
        const url = new URL(imageUrl)
        const pathParts = url.pathname.split("/")
        // Format: /storage/v1/object/public/bucket-name/path/to/file
        if (pathParts.length >= 6) {
          const filePath = pathParts.slice(6).join("/")
          await SupabaseStorageService.deleteFile(filePath, "property-images")
        }
      } catch (urlError) {
        console.warn("⚠️ Impossible de supprimer le fichier physique:", urlError)
        // Continue même si la suppression du fichier échoue
      }

      console.log("✅ Image supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deletePropertyImage:", error)
      throw error
    }
  },

  async getPropertyImages(propertyId: string) {
    console.log("📋 Récupération images pour propriété:", propertyId)

    try {
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", propertyId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true })

      if (error) {
        console.error("❌ Erreur récupération images:", error)
        throw error
      }

      console.log("✅ Images récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getPropertyImages:", error)
      throw error
    }
  },
}
