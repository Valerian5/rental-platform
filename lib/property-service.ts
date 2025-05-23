import { createClientComponentClient, createServerComponentClient } from "./supabase"
import type { Property } from "@/types/property"

export const propertyService = {
  // Récupérer toutes les propriétés (côté serveur)
  async getAllProperties() {
    const supabase = createServerComponentClient()

    const { data, error } = await supabase
      .from("properties")
      .select(`
        *,
        owner:users(id, first_name, last_name, email, phone),
        images:property_images(id, url, is_primary)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as Property[]
  },

  // Récupérer les propriétés d'un propriétaire
  async getOwnerProperties(ownerId: string) {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("properties")
      .select(`
        *,
        images:property_images(id, url, is_primary)
      `)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as Property[]
  },

  // Récupérer une propriété par son ID
  async getPropertyById(id: string) {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("properties")
      .select(`
        *,
        owner:users(id, first_name, last_name, email, phone),
        images:property_images(id, url, is_primary)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return data as Property
  },

  // Créer une nouvelle propriété
  async createProperty(propertyData: Omit<Property, "id" | "created_at" | "updated_at">) {
    const supabase = createClientComponentClient()

    // 1. Insérer la propriété
    const { data, error } = await supabase.from("properties").insert(propertyData).select().single()

    if (error) throw error

    return data as Property
  },

  // Mettre à jour une propriété
  async updateProperty(id: string, propertyData: Partial<Property>) {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("properties")
      .update({
        ...propertyData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data as Property
  },

  // Supprimer une propriété
  async deleteProperty(id: string) {
    const supabase = createClientComponentClient()

    const { error } = await supabase.from("properties").delete().eq("id", id)

    if (error) throw error

    return true
  },

  // Ajouter une image à une propriété
  async addPropertyImage(propertyId: string, imageUrl: string, isPrimary = false) {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("property_images")
      .insert({
        property_id: propertyId,
        url: imageUrl,
        is_primary: isPrimary,
      })
      .select()
      .single()

    if (error) throw error

    return data
  },
}
