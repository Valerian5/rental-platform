import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id requis" }, { status: 400 })
    }

    console.log("🔍 Recherche dossier location pour tenant:", tenantId)

    // Récupérer le dossier de location simple
    const { data: rentalFile, error: rentalFileError } = await supabase
      .from("rental_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (rentalFileError && rentalFileError.code !== "PGRST116") {
      console.error("❌ Erreur récupération rental_files:", rentalFileError)
      return NextResponse.json({ error: rentalFileError.message }, { status: 500 })
    }

    // Récupérer le dossier de location complet
    const { data: rentalFileData, error: rentalFileDataError } = await supabase
      .from("rental_file_data")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (rentalFileDataError && rentalFileDataError.code !== "PGRST116") {
      console.error("❌ Erreur récupération rental_file_data:", rentalFileDataError)
    }

    // Retourner les données disponibles
    const result = {
      rental_file: rentalFile,
      rental_file_data: rentalFileData,
    }

    console.log("✅ Dossier trouvé:", !!rentalFile, "Données complètes:", !!rentalFileData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
