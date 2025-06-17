import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("🔍 Recherche locataire pour candidature ID:", id)

    // Récupérer la candidature avec les informations du tenant
    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        *,
        tenant:users!tenant_id(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("❌ Erreur récupération candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!application || !application.tenant) {
      console.error("❌ Candidature ou locataire non trouvé")
      return NextResponse.json({ error: "Candidature ou locataire non trouvé" }, { status: 404 })
    }

    console.log("✅ Locataire trouvé:", application.tenant.email)
    return NextResponse.json({ tenant: application.tenant })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
