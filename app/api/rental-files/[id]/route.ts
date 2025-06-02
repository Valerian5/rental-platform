import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rentalFileId = params.id

    // Vérifier l'authentification
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer le dossier de location
    const { data: rentalFile, error } = await supabase.from("rental_files").select("*").eq("id", rentalFileId).single()

    if (error) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })
    }

    // Vérifier les permissions (propriétaire ou locataire concerné)
    if (user.user_type === "tenant" && rentalFile.tenant_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (user.user_type === "owner") {
      // Vérifier que le propriétaire a bien reçu une candidature pour ce dossier
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("property_id")
        .eq("tenant_id", rentalFile.tenant_id)
        .single()

      if (appError) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }

      // Vérifier que la propriété appartient bien au propriétaire
      const { data: property, error: propError } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", application.property_id)
        .single()

      if (propError || property.owner_id !== user.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }
    }

    return NextResponse.json({ rental_file: rentalFile })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
