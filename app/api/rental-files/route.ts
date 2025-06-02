import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const id = searchParams.get("id")

    console.log("🔍 Recherche dossier location - tenant_id:", tenantId, "id:", id)

    let query = supabase.from("rental_files").select("*")

    if (id) {
      query = query.eq("id", id)
    } else if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    } else {
      return NextResponse.json({ error: "tenant_id ou id requis" }, { status: 400 })
    }

    const { data: rentalFiles, error } = await query

    if (error) {
      console.error("❌ Erreur Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Dossiers trouvés:", rentalFiles?.length || 0)

    if (!rentalFiles || rentalFiles.length === 0) {
      return NextResponse.json({
        rental_file: null,
        message: "Aucun dossier de location trouvé",
      })
    }

    const rentalFile = rentalFiles[0]
    console.log("📄 Dossier récupéré:", {
      id: rentalFile.id,
      tenant_id: rentalFile.tenant_id,
      has_main_tenant: !!rentalFile.main_tenant,
      has_guarantors: !!rentalFile.guarantors,
      guarantors_count: rentalFile.guarantors?.length || 0,
    })

    return NextResponse.json({
      rental_file: rentalFile,
      success: true,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
