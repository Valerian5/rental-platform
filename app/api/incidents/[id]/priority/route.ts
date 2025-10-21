import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const body = await request.json()
    const { priority } = body

    if (!incidentId || !priority) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const validPriorities = ["low", "medium", "high", "urgent"]
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Priorité invalide" }, { status: 400 })
    }

    console.log("🎯 [PRIORITY API] Mise à jour priorité pour incident:", incidentId, "->", priority)

    const server = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await server
      .from("incidents")
      .update({ priority })
      .eq("id", incidentId)
      .select()
      .single()

    if (error) {
      console.error("❌ [PRIORITY API] Erreur mise à jour priorité:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ [PRIORITY API] Priorité mise à jour:", data.id)
    return NextResponse.json({ success: true, incident: data })
  } catch (error) {
    console.error("❌ [PRIORITY API] Erreur:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
