import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const id = searchParams.get("id")

    console.log("🔍 API rental-files - Paramètres reçus:", { tenantId, id })
    console.log("🔍 URL complète:", request.url)

    if (!tenantId && !id) {
      console.log("❌ Paramètres manquants")
      return NextResponse.json({ error: "tenant_id ou id requis" }, { status: 400 })
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

    // Construire la requête
    let query = supabase.from("rental_files").select("*")

    if (id) {
      console.log("🔍 Recherche par ID:", id)
      query = query.eq("id", id)
    } else if (tenantId) {
      console.log("🔍 Recherche par tenant_id:", tenantId)
      query = query.eq("tenant_id", tenantId)
    }

    console.log("📡 Exécution de la requête...")
    const { data: rentalFiles, error } = await query

    if (error) {
      console.error("❌ Erreur requête Supabase:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
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

    console.log("✅ Requête exécutée avec succès")
    console.log("📊 Résultats:", rentalFiles?.length || 0, "dossiers trouvés")

    if (!rentalFiles || rentalFiles.length === 0) {
      console.log("📭 Aucun dossier trouvé")
      return NextResponse.json({
        rental_file: null,
        message: "Aucun dossier de location trouvé",
        success: false,
        search_params: { tenantId, id },
      })
    }

    const rentalFile = rentalFiles[0]
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
