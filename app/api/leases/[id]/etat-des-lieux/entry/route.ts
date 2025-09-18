import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const leaseId = params.id

    // Récupérer l'état des lieux d'entrée
    const { data, error } = await supabase
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", "entree")
      .single()

    if (error) {
      console.error("Erreur récupération état d'entrée:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Aucun état d'entrée trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      general_info: data.general_info,
      rooms: data.rooms,
      property_data: data.property_data,
      lease_data: data.lease_data,
    })
  } catch (error) {
    console.error("Erreur API état d'entrée:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
