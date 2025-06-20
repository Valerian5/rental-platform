import { supabase } from "./supabase"
import { imageService } from "./image-service"

export const propertyService = {
  async createProperty(propertyData: any) {
    console.log("🏠 Création propriété:", propertyData.title)

    try {
      const { data, error } = await supabase
        .from("properties")
        .insert({
          title: propertyData.title,
          description: propertyData.description,
          address: propertyData.address,
          city: propertyData.city,
          postal_code: propertyData.postal_code,
          price: propertyData.price,
          surface: propertyData.surface,
          rooms: propertyData.rooms,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          property_type: propertyData.property_type,
          furnished: propertyData.furnished,
          available: propertyData.available,
          owner_id: propertyData.owner_id,
          // Nouveaux champs
          hide_exact_address: propertyData.hide_exact_address || false,
          construction_year: propertyData.construction_year,
          charges: propertyData.charges || 0,
          deposit: propertyData.deposit || 0,
          fees: propertyData.fees || 0,
          floor: propertyData.floor,
          total_floors: propertyData.total_floors,
          balcony: propertyData.balcony || false,
          terrace: propertyData.terrace || false,
          garden: propertyData.garden || false,
          loggia: propertyData.loggia || false,
          equipped_kitchen: propertyData.equipped_kitchen || false,
          bathtub: propertyData.bathtub || false,
          shower: propertyData.shower || false,
          dishwasher: propertyData.dishwasher || false,
          washing_machine: propertyData.washing_machine || false,
          dryer: propertyData.dryer || false,
          fridge: propertyData.fridge || false,
          oven: propertyData.oven || false,
          microwave: propertyData.microwave || false,
          air_conditioning: propertyData.air_conditioning || false,
          fireplace: propertyData.fireplace || false,
          parking: propertyData.parking || false,
          cellar: propertyData.cellar || false,
          elevator: propertyData.elevator || false,
          intercom: propertyData.intercom || false,
          digicode: propertyData.digicode || false,
          availability_date: propertyData.availability_date || null,
          energy_class: propertyData.energy_class || null,
          ges_class: propertyData.ges_class || null,
          heating_type: propertyData.heating_type || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création propriété:", error)
        throw error
      }

      console.log("✅ Propriété créée:", data.id)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createProperty:", error)
      throw error
    }
  },

  async uploadPropertyImages(propertyId: string, imageUrls: string[]) {
    console.log("📤 Upload images pour propriété:", propertyId, imageUrls.length, "images")

    try {
      const results = []

      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i]
        const isPrimary = i === 0 // La première image est principale

        const result = await imageService.savePropertyImageMetadata(propertyId, imageUrl, isPrimary)
        results.push(result)
      }

      console.log("✅ Images sauvegardées:", results.length)
      return results
    } catch (error) {
      console.error("❌ Erreur dans uploadPropertyImages:", error)
      throw error
    }
  },

  async getPropertyById(propertyId: string) {
    console.log("📋 Récupération propriété:", propertyId)

    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_images (*)
        `)
        .eq("id", propertyId)
        .single()

      if (error) {
        console.error("❌ Erreur récupération propriété:", error)
        throw error
      }

      console.log("✅ Propriété récupérée:", data.title)
      return data
    } catch (error) {
      console.error("❌ Erreur dans getPropertyById:", error)
      throw error
    }
  },

  async deleteProperty(propertyId: string) {
    console.log("🗑️ Suppression propriété:", propertyId)

    try {
      // Supprimer les images associées
      const images = await imageService.getPropertyImages(propertyId)
      for (const image of images) {
        await imageService.deletePropertyImage(image.id, image.url)
      }

      // Supprimer la propriété
      const { error } = await supabase.from("properties").delete().eq("id", propertyId)

      if (error) {
        console.error("❌ Erreur suppression propriété:", error)
        throw error
      }

      console.log("✅ Propriété supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deleteProperty:", error)
      throw error
    }
  },
}
