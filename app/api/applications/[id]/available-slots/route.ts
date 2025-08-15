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

    console.log("🔍 Récupération créneaux pour candidature:", applicationId)

    // Vérifier que l'application existe
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, property_id, tenant_id, status")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Récupérer les créneaux de visite disponibles pour cette propriété
    const { data: visitSlots, error: slotsError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", application.property_id)
      .eq("is_available", true)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (slotsError) {
      console.error("❌ Erreur récupération créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
    }

    console.log("✅ Créneaux récupérés:", visitSlots?.length || 0)

    // Filtrer les créneaux futurs
    const now = new Date()
    const futureSlots = (visitSlots || []).filter((slot) => {
      const slotDateTime = new Date(`${slot.date}T${slot.start_time}`)
      return slotDateTime > now
    })

    return NextResponse.json({
      success: true,
      slots: futureSlots,
      total: futureSlots.length,
      application: {
        id: application.id,
        status: application.status,
      },
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
