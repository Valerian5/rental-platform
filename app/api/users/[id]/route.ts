import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase"

// Créer un client Supabase avec les variables d'environnement
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("👤 API Users GET ID:", params.id)

    if (!params.id) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 })
    }

    // Récupérer l'utilisateur directement avec Supabase
    const { data: user, error } = await supabase.from("users").select("*").eq("id", params.id).single()

    if (error) {
      console.error("❌ Erreur récupération utilisateur:", error)
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    console.log("✅ Utilisateur récupéré:", user.email)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
