import { createServerClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })

    const { features, quotas } = await request.json()

    // Mettre à jour les fonctionnalités et quotas du plan
    const { error } = await supabase
      .from("pricing_plans")
      .update({ 
        features: features || [],
        quotas: quotas || {}
      })
      .eq("id", params.id)

    if (error) {
      console.error("❌ Erreur mise à jour fonctionnalités:", error)
      return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("❌ Erreur API features:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
