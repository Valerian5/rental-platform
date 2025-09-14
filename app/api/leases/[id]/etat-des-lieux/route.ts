import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/leases/[id]/etat-des-lieux
// Récupère les documents d'état des lieux pour un bail
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const server = createServerClient()

    // Récupérer les documents d'état des lieux
    const { data: documents, error } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération documents:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des documents" }, { status: 500 })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error("Erreur GET etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/leases/[id]/etat-des-lieux
// Crée un nouveau document d'état des lieux
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { type, status = "draft", digital_data } = await request.json()
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

    // Créer le document d'état des lieux
    const { data: document, error } = await server
      .from("etat_des_lieux_documents")
      .insert({
        lease_id: leaseId,
        property_id: lease.property_id,
        type,
        status,
        digital_data,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création document:", error)
      return NextResponse.json({ error: "Erreur lors de la création du document" }, { status: 500 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Erreur POST etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
