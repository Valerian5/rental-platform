import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/leases/[id]/etat-des-lieux/digital
// Récupère un état des lieux numérique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'entree'
    const server = createServerClient()

    // Récupérer l'état des lieux numérique
    const { data: document, error } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", type)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Erreur récupération numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ general_info: null, rooms: [] })
    }

    return NextResponse.json(document.digital_data || { general_info: null, rooms: [] })
  } catch (error) {
    console.error("Erreur GET digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/leases/[id]/etat-des-lieux/digital
// Sauvegarde un état des lieux numérique
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { general_info, rooms, property_data, lease_data } = await request.json()
    const server = createServerClient()

    // Vérifier que le bail existe
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    // Préparer les données numériques
    const digitalData = {
      general_info,
      rooms,
      property_data,
      lease_data,
      created_at: new Date().toISOString(),
    }

    // Créer ou mettre à jour le document d'état des lieux numérique
    const { data: document, error } = await server
      .from("etat_des_lieux_documents")
      .upsert({
        lease_id: leaseId,
        property_id: lease.property_id,
        type: general_info.type || "entree",
        status: "draft",
        digital_data: digitalData,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur sauvegarde numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Erreur digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
