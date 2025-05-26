import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Test de la configuration Supabase Storage...")

    // Test 1: Lister les buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("❌ Erreur buckets:", bucketsError)
      return NextResponse.json({ error: "Erreur buckets", details: bucketsError }, { status: 500 })
    }

    console.log("📁 Buckets disponibles:", buckets)

    // Test 2: Vérifier le bucket property-images
    const propertyImagesBucket = buckets.find((b) => b.name === "property-images")

    if (!propertyImagesBucket) {
      console.error("❌ Bucket property-images non trouvé")
      return NextResponse.json(
        {
          error: "Bucket property-images non trouvé",
          availableBuckets: buckets.map((b) => b.name),
        },
        { status: 404 },
      )
    }

    // Test 3: Lister les fichiers dans le bucket
    const { data: files, error: filesError } = await supabase.storage.from("property-images").list("", { limit: 10 })

    if (filesError) {
      console.error("❌ Erreur fichiers:", filesError)
      return NextResponse.json({ error: "Erreur fichiers", details: filesError }, { status: 500 })
    }

    console.log("📄 Fichiers dans property-images:", files?.length || 0)

    // Test 4: Générer une URL publique de test
    let testUrl = null
    if (files && files.length > 0) {
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(files[0].name)

      testUrl = urlData.publicUrl
      console.log("🔗 URL de test:", testUrl)
    }

    return NextResponse.json({
      success: true,
      buckets: buckets.map((b) => ({ name: b.name, public: b.public })),
      propertyImagesBucket: {
        name: propertyImagesBucket.name,
        public: propertyImagesBucket.public,
        filesCount: files?.length || 0,
      },
      files: files?.slice(0, 5).map((f) => ({ name: f.name, size: f.metadata?.size })),
      testUrl,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur générale:", error)
    return NextResponse.json({ error: "Erreur générale", details: error }, { status: 500 })
  }
}
