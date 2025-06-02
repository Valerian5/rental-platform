import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id est requis" }, { status: 400 })
    }

    console.log("🔍 Recherche dossier location pour tenant:", tenantId)

    // Récupérer le dossier de location du locataire
    const { data: rentalFile, error } = await supabase
      .from("rental_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (error) {
      console.error("❌ Erreur récupération dossier location:", error)
      // Si pas de dossier trouvé, ce n'est pas forcément une erreur
      if (error.code === "PGRST116") {
        console.log("ℹ️ Aucun dossier de location trouvé pour ce locataire")
        return NextResponse.json({ rental_file: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Dossier de location trouvé:", rentalFile?.id)
    return NextResponse.json({ rental_file: rentalFile })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
