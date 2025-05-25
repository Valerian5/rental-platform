import { supabase } from "./supabase"

export const imageService = {
  // Upload d'une image vers Supabase Storage
  async uploadPropertyImage(file: File, propertyId: string): Promise<string> {
    console.log("📸 ImageService.uploadPropertyImage - Début", { fileName: file.name, propertyId })

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop()
      const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      console.log("📁 Nom de fichier généré:", fileName)

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage.from("property-images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("❌ Erreur lors de l'upload:", error)
        throw new Error(`Erreur upload: ${error.message}`)
      }

      console.log("✅ Fichier uploadé:", data)

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log("🔗 URL publique générée:", publicUrl)

      return publicUrl
    } catch (error) {
      console.error("❌ Erreur dans uploadPropertyImage:", error)
      throw error
    }
  },

  // Sauvegarder les métadonnées d'une image en base
  async savePropertyImageMetadata(propertyId: string, url: string, isPrimary = false) {
    console.log("💾 ImageService.savePropertyImageMetadata", { propertyId, url, isPrimary })

    try {
      // Si c'est l'image principale, désactiver les autres images principales
      if (isPrimary) {
        await supabase.from("property_images").update({ is_primary: false }).eq("property_id", propertyId)
      }

      // Insérer la nouvelle image
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
        console.error("❌ Erreur lors de la sauvegarde des métadonnées:", error)
        throw new Error(`Erreur sauvegarde métadonnées: ${error.message}`)
      }

      console.log("✅ Métadonnées sauvegardées:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans savePropertyImageMetadata:", error)
      throw error
    }
  },

  // Supprimer une image
  async deletePropertyImage(imageId: string, imageUrl: string) {
    console.log("🗑️ ImageService.deletePropertyImage", { imageId, imageUrl })

    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = imageUrl.split("/")
      const fileName = urlParts[urlParts.length - 2] + "/" + urlParts[urlParts.length - 1]

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage.from("property-images").remove([fileName])

      if (storageError) {
        console.warn("⚠️ Erreur lors de la suppression du fichier:", storageError)
        // On continue même si la suppression du fichier échoue
      }

      // Supprimer les métadonnées de la base
      const { error: dbError } = await supabase.from("property_images").delete().eq("id", imageId)

      if (dbError) {
        console.error("❌ Erreur lors de la suppression des métadonnées:", dbError)
        throw new Error(`Erreur suppression métadonnées: ${dbError.message}`)
      }

      console.log("✅ Image supprimée avec succès")
      return true
    } catch (error) {
      console.error("❌ Erreur dans deletePropertyImage:", error)
      throw error
    }
  },

  // Récupérer les images d'une propriété
  async getPropertyImages(propertyId: string) {
    console.log("📸 ImageService.getPropertyImages - ID:", propertyId)

    try {
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", propertyId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true })

      if (error) {
        console.error("❌ Erreur lors de la récupération des images:", error)
        throw new Error(error.message)
      }

      console.log("✅ Images récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getPropertyImages:", error)
      return []
    }
  },
}