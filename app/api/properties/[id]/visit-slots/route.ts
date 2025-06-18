import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Configuration importante pour éviter la mise en cache
export const dynamic = 'force-dynamic'

// Middleware CORS pour le développement
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 GET visit-slots pour propriété:", params.id)

    // Vérification de l'authentification
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentification requise" }, 
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Token invalide" },
        { status: 401 }
      )
    }

    // Vérification de la propriété
    if (!params.id) {
      return NextResponse.json(
        { success: false, error: "ID de propriété manquant" },
        { status: 400 }
      )
    }

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, owner_id")
      .eq("id", params.id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: "Propriété non trouvée" },
        { status: 404 }
      )
    }

    // Vérification des permissions
    const { data: userProfile } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    const isOwner = property.owner_id === user.id
    const isTenant = userProfile?.user_type === "tenant"

    if (!isOwner && !isTenant) {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Récupération des créneaux
    const { data: slots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", params.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (slotsError) {
      console.error("Erreur Supabase:", slotsError)
      return NextResponse.json(
        { 
          success: false,
          error: "Erreur de base de données",
          details: slotsError.message 
        },
        { status: 500 }
      )
    }

    // Formatage de la réponse
    const responseData = {
      success: true,
      slots: slots || [],
      is_empty: !slots || slots.length === 0,
      count: slots?.length || 0
    }

    console.log(`Retourne ${responseData.count} créneaux`)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error("Erreur inattendue:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("💾 POST visit-slots pour propriété:", params.id)

    // Vérification de l'authentification
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentification requise" }, 
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Token invalide" },
        { status: 401 }
      )
    }

    // Vérification des permissions (seul le propriétaire peut modifier)
    const { data: userProfile } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (userProfile?.user_type !== "owner") {
      return NextResponse.json(
        { success: false, error: "Réservé aux propriétaires" },
        { status: 403 }
      )
    }

    // Vérification de la propriété
    const { data: property } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", params.id)
      .single()

    if (property?.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Vous n'êtes pas le propriétaire" },
        { status: 403 }
      )
    }

    // Traitement des données
    const { slots } = await request.json()
    
    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { success: false, error: "Format de données invalide" },
        { status: 400 }
      )
    }

    // Transaction pour remplacer tous les créneaux
    const { data: insertedSlots, error: transactionError } = await supabase
      .rpc('replace_all_slots', {
        property_id: params.id,
        new_slots: slots.map(slot => ({
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          max_capacity: slot.max_capacity || 1,
          is_group_visit: slot.is_group_visit || false,
          current_bookings: slot.current_bookings || 0,
          is_available: slot.is_available !== false
        }))
      })

    if (transactionError) {
      throw transactionError
    }

    console.log(`${insertedSlots?.length || 0} créneaux sauvegardés`)

    return NextResponse.json({
      success: true,
      message: "Créneaux mis à jour avec succès",
      count: insertedSlots?.length || 0,
      slots: insertedSlots || []
    })

  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Échec de la sauvegarde",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}