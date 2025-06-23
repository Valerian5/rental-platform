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
      // Si c'est l'image principale, désactiver les autres
      if (isPrimary) {
        await supabase.from("property_images").update({ is_primary: false }).eq("property_id", propertyId)
      }

      const { data, error } = await supabase
        .from("property_images")
        .insert({
          property_id: propertyId,
          url: imageUrl,
          is_primary: isPrimary,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur sauvegarde métadonnées:", error)
        throw error
      }

      console.log("✅ Métadonnées image sauvegardées")
      return data
    } catch (error) {
      console.error("❌ Erreur savePropertyImageMetadata:", error)
      throw error
    }
  },
}
