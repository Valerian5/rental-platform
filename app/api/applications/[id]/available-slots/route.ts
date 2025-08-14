import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id

    // Récupérer l'application pour avoir l'ID de la propriété
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("property_id")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Récupérer les créneaux disponibles pour cette propriété
    const { data: slots, error: slotsError } = await supabase
      .from("visit_slots")
      .select("*")
      .eq("property_id", application.property_id)
      .eq("is_available", true)
      .is("application_id", null) // Créneaux non encore associés
      .gte("date", new Date().toISOString().split("T")[0]) // Créneaux futurs uniquement
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (slotsError) {
      console.error("❌ Erreur récupération créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slots: slots || [],
      total: slots?.length || 0,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
