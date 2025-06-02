import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("🔍 Recherche dossier location ID:", id)

    // Récupérer le dossier de location par ID
    const { data: rentalFile, error } = await supabase.from("rental_files").select("*").eq("id", id).single()

    if (error) {
      console.error("❌ Erreur récupération dossier location:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Dossier de location trouvé:", rentalFile?.id)
    return NextResponse.json({ rental_file: rentalFile })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
