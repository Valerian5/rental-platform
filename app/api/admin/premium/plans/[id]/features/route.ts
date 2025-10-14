import { createServerClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    
    // Vérifier l'authentification via les cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("❌ Erreur auth:", authError)
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (userData?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 })
    }

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
