import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 GET visit-slots pour propriété:", params.id)

    // Récupérer le token d'autorisation depuis les headers
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Pas de token d'autorisation")
      return NextResponse.json({ error: "Vous devez être connecté" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Enlever "Bearer "

    // Vérifier le token avec Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log("❌ Token invalide:", authError)
      return NextResponse.json({ error: "Token d'authentification invalide" }, { status: 401 })
    }

    console.log("✅ Utilisateur authentifié:", user.id)

    // Vérifier que l'ID de propriété est fourni
    if (!params.id) {
      return NextResponse.json({ error: "ID de propriété manquant" }, { status: 400 })
    }

    // Vérifier que la propriété existe
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, owner_id")
      .eq("id", params.id)
      .single()

    if (propertyError || !property) {
      console.error("Erreur lors de la récupération de la propriété:", propertyError)
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erreur profil:", profileError)
      return NextResponse.json({ error: "Erreur profil utilisateur" }, { status: 500 })
    }

    // Vérifier les permissions
    const isOwner = property.owner_id === user.id
    const isTenant = userProfile.user_type === "tenant"

    if (!isOwner && !isTenant) {
      return NextResponse.json({ error: "Vous n'avez pas accès à cette propriété" }, { status: 403 })
    }

    // Récupérer les créneaux de visite
    const { data: slots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", params.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (slotsError) {
      console.error("Erreur lors de la récupération des créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
    }

    // Filtrer les créneaux pour les locataires
    const filteredSlots = isTenant
      ? (slots || []).filter((slot) => slot.is_available && new Date(slot.date) >= new Date())
      : slots || []

    console.log("✅ Créneaux récupérés:", filteredSlots.length)
    return NextResponse.json({ slots: filteredSlots })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des créneaux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("💾 POST visit-slots pour propriété:", params.id)

    // Récupérer le token d'autorisation depuis les headers
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Pas de token d'autorisation")
      return NextResponse.json({ error: "Vous devez être connecté" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Enlever "Bearer "

    // Vérifier le token avec Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log("❌ Token invalide:", authError)
      return NextResponse.json({ error: "Token d'authentification invalide" }, { status: 401 })
    }

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || userProfile.user_type !== "owner") {
      return NextResponse.json({ error: "Vous devez être connecté en tant que propriétaire" }, { status: 401 })
    }

    // Vérifier que l'ID de propriété est fourni
    if (!params.id) {
      return NextResponse.json({ error: "ID de propriété manquant" }, { status: 400 })
    }

    // Vérifier que la propriété existe et appartient à l'utilisateur
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, owner_id")
      .eq("id", params.id)
      .single()

    if (propertyError || !property) {
      console.error("Erreur lors de la récupération de la propriété:", propertyError)
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    if (property.owner_id !== user.id) {
      return NextResponse.json({ error: "Vous n'êtes pas le propriétaire de cette propriété" }, { status: 403 })
    }

    // Récupérer les données du corps de la requête
    const { slots } = await request.json()

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "Format de données invalide" }, { status: 400 })
    }

    // Supprimer tous les créneaux existants pour cette propriété
    const { error: deleteError } = await supabase.from("property_visit_slots").delete().eq("property_id", params.id)

    if (deleteError) {
      console.error("Erreur lors de la suppression des créneaux:", deleteError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour des créneaux" }, { status: 500 })
    }

    // Si aucun nouveau créneau n'est fourni, terminer ici
    if (slots.length === 0) {
      console.log("✅ Tous les créneaux supprimés pour la propriété:", params.id)
      return NextResponse.json({
        message: "Tous les créneaux ont été supprimés",
        slots: [],
      })
    }

    // Valider et préparer les nouveaux créneaux
    const validatedSlots = slots.map((slot: any) => ({
      property_id: params.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      max_capacity: slot.max_capacity || 1,
      is_group_visit: slot.is_group_visit || false,
      current_bookings: slot.current_bookings || 0,
      is_available: slot.is_available !== false,
    }))

    // Insérer les nouveaux créneaux
    const { data: insertedSlots, error: insertError } = await supabase
      .from("property_visit_slots")
      .insert(validatedSlots)
      .select()

    if (insertError) {
      console.error("Erreur lors de l'insertion des créneaux:", insertError)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde des créneaux" }, { status: 500 })
    }

    console.log("✅ Créneaux sauvegardés avec succès:", insertedSlots?.length || 0)

    return NextResponse.json({
      message: `${insertedSlots?.length || 0} créneaux sauvegardés avec succès`,
      slots: insertedSlots,
    })
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde des créneaux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
