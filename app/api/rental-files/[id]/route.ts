import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log("🔍 API rental-files/[id] - ID reçu:", id)

    if (!id) {
      console.log("❌ ID manquant")
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Vérifier la connexion Supabase
    console.log("🔗 Test connexion Supabase...")
    const { data: testData, error: testError } = await supabase.from("rental_files").select("count").limit(1)

    if (testError) {
      console.error("❌ Erreur connexion Supabase:", testError)
      return NextResponse.json(
        {
          error: "Erreur de connexion à la base de données",
          details: testError.message,
          code: testError.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ Connexion Supabase OK")

    // Rechercher le dossier par ID
    console.log("🔍 Recherche dossier par ID:", id)
    const { data: rentalFile, error } = await supabase.from("rental_files").select("*").eq("id", id).single()

    if (error) {
      console.error("❌ Erreur requête Supabase:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            error: "Dossier de location non trouvé",
            rental_file: null,
            success: false,
          },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          error: `Erreur base de données: ${error.message}`,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    if (!rentalFile) {
      console.log("📭 Aucun dossier trouvé pour l'ID:", id)
      return NextResponse.json({
        rental_file: null,
        message: "Aucun dossier de location trouvé",
        success: false,
      })
    }

    console.log("📄 Dossier récupéré:", {
      id: rentalFile.id,
      tenant_id: rentalFile.tenant_id,
      status: rentalFile.status,
      has_main_tenant: !!rentalFile.main_tenant,
      has_guarantors: !!rentalFile.guarantors,
      guarantors_count: rentalFile.guarantors?.length || 0,
    })

    return NextResponse.json({
      rental_file: rentalFile,
      success: true,
    })
  } catch (error) {
    console.error("❌ Erreur serveur complète:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        message: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
