import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("property_id")

    console.log("🔍 Debug property images pour:", propertyId)

    // Récupérer quelques propriétés avec leurs images
    const { data: properties, error: propertiesError } = await supabase.from("properties").select("id, title").limit(5)

    if (propertiesError) {
      console.error("❌ Erreur récupération propriétés:", propertiesError)
      return NextResponse.json({ error: "Erreur propriétés" }, { status: 500 })
    }

    // Pour chaque propriété, récupérer ses images
    const propertiesWithImages = await Promise.all(
      (properties || []).map(async (property) => {
        const { data: images, error: imagesError } = await supabase
          .from("property_images")
          .select("url, is_primary")
          .eq("property_id", property.id)

        return {
          property,
          images: images || [],
          imagesError: imagesError?.message || null,
        }
      }),
    )

    // Récupérer aussi la structure de la table property_images
    const { data: sampleImages, error: sampleError } = await supabase.from("property_images").select("*").limit(5)

    return NextResponse.json({
      properties_with_images: propertiesWithImages,
      sample_images: sampleImages || [],
      sample_error: sampleError?.message || null,
    })
  } catch (error) {
    console.error("❌ Erreur debug property images:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
