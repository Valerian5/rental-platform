import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Test de la configuration Supabase Storage...")

    if (!isSupabaseConfigured()) {
      console.log("⚠️ Supabase non configuré - mode développement")
      return NextResponse.json({
        success: false,
        message: "Supabase non configuré",
        buckets: [],
        files: [],
      })
    }

    const supabase = createServerClient()

    // Test de connexion aux buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("❌ Erreur buckets:", bucketsError)
      return NextResponse.json({
        success: false,
        error: bucketsError.message,
        buckets: [],
        files: [],
      })
    }

    console.log("✅ Buckets récupérés:", buckets?.length || 0)

    // Test de listage des fichiers dans le bucket 'properties' s'il existe
    let files = []
    const propertiesBucket = buckets?.find((bucket) => bucket.name === "properties")

    if (propertiesBucket) {
      const { data: filesList, error: filesError } = await supabase.storage.from("properties").list("", { limit: 10 })

      if (filesError) {
        console.error("❌ Erreur fichiers:", filesError)
      } else {
        files = filesList || []
        console.log("✅ Fichiers récupérés:", files.length)
      }
    }

    return NextResponse.json({
      success: true,
      buckets: buckets || [],
      files,
      message: "Test Supabase Storage réussi",
    })
  } catch (error) {
    console.error("❌ Erreur test storage:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        buckets: [],
        files: [],
      },
      { status: 500 },
    )
  }
}
