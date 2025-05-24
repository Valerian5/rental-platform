import { supabase } from "./supabase"

export const imageService = {
  // Upload d'une image vers Supabase Storage
  async uploadPropertyImage(file: File, propertyId: string): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage.from("property-images").upload(fileName, file)

      if (error) {
        throw new Error(error.message)
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image:", error)
      throw error
    }
  },

  // Sauvegarder les métadonnées de l'image en base
  async savePropertyImageMetadata(propertyId: string, url: string, isPrimary = false) {
    try {
      const { data, error } = await supabase
        .from("property_images")
        .insert({
          property_id: propertyId,
          url: url,
          is_primary: isPrimary,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des métadonnées:", error)
      throw error
    }
  },

  // Upload multiple images
  async uploadMultipleImages(files: File[], propertyId: string) {
    try {
      const uploadPromises = files.map((file, index) =>
        this.uploadPropertyImage(file, propertyId).then((url) =>
          this.savePropertyImageMetadata(propertyId, url, index === 0),
        ),
      )

      const results = await Promise.all(uploadPromises)
      return results
    } catch (error) {
      console.error("Erreur lors de l'upload multiple:", error)
      throw error
    }
  },

  // Supprimer une image
  async deletePropertyImage(imageId: string, imageUrl: string) {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = imageUrl.split("/")
      const fileName = urlParts[urlParts.length - 2] + "/" + urlParts[urlParts.length - 1]

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage.from("property-images").remove([fileName])

      if (storageError) {
        console.warn("Erreur lors de la suppression du fichier:", storageError)
      }

      // Supprimer les métadonnées de la base
      const { error: dbError } = await supabase.from("property_images").delete().eq("id", imageId)

      if (dbError) {
        throw new Error(dbError.message)
      }

      return true
    } catch (error) {
      console.error("Erreur lors de la suppression de l'image:", error)
      throw error
    }
  },
}
