import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("📋 Listage des documents disponibles...")

    // Lister les fichiers dans le bucket 'documents'
    const { data: documentsFiles, error: documentsError } = await supabase.storage
      .from("documents")
      .list("", { limit: 100 })

    // Lister les fichiers dans le bucket 'rental-files'
    const { data: rentalFiles, error: rentalError } = await supabase.storage
      .from("rental-files")
      .list("", { limit: 100 })

    const result = {
      documents_bucket: {
        files: documentsFiles || [],
        error: documentsError?.message,
        count: documentsFiles?.length || 0,
      },
      rental_files_bucket: {
        files: rentalFiles || [],
        error: rentalError?.message,
        count: rentalFiles?.length || 0,
      },
      total_files: (documentsFiles?.length || 0) + (rentalFiles?.length || 0),
    }

    console.log("📊 Résultat du listage:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Erreur lors du listage:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
