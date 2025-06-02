import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth-service"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id
    const body = await request.json()

    // Vérifier l'authentification
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est bien le propriétaire de cette candidature
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("property_id")
      .eq("id", applicationId)
      .single()

    if (appError) {
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
    }

    // Vérifier que la propriété appartient bien à l'utilisateur
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", application.property_id)
      .single()

    if (propError || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Mettre à jour le statut de la candidature
    const { data, error } = await supabase
      .from("applications")
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ application: data[0] })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
