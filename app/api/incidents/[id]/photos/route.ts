import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const formData = await request.formData()
    const photos = formData.getAll('photos') as File[]

    if (!photos || photos.length === 0) {
      return NextResponse.json({ success: false, error: "Aucune photo fournie" }, { status: 400 })
    }

    console.log("🔍 [API INCIDENT PHOTOS] Upload de", photos.length, "photos pour incident:", incidentId)

    // Récupérer l'incident existant pour avoir les photos actuelles
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("photos")
      .eq("id", incidentId)
      .single()

    if (incidentError) {
      console.error("❌ [API INCIDENT PHOTOS] Erreur récupération incident:", incidentError)
      return NextResponse.json({ success: false, error: "Incident non trouvé" }, { status: 404 })
    }

    const currentPhotos = incident.photos || []
    const newPhotoUrls: string[] = []

    // Upload chaque photo vers Supabase Storage
    for (const photo of photos) {
      try {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `incidents/${incidentId}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, photo)

        if (uploadError) {
          console.error("❌ [API INCIDENT PHOTOS] Erreur upload photo:", uploadError)
          continue
        }

        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)

        newPhotoUrls.push(urlData.publicUrl)
        console.log("✅ [API INCIDENT PHOTOS] Photo uploadée:", urlData.publicUrl)

      } catch (photoError) {
        console.error("❌ [API INCIDENT PHOTOS] Erreur traitement photo:", photoError)
        continue
      }
    }

    if (newPhotoUrls.length === 0) {
      return NextResponse.json({ success: false, error: "Aucune photo n'a pu être uploadée" }, { status: 500 })
    }

    // Mettre à jour l'incident avec les nouvelles photos
    const updatedPhotos = [...currentPhotos, ...newPhotoUrls]
    const { error: updateError } = await supabase
      .from("incidents")
      .update({ 
        photos: updatedPhotos,
        updated_at: new Date().toISOString()
      })
      .eq("id", incidentId)

    if (updateError) {
      console.error("❌ [API INCIDENT PHOTOS] Erreur mise à jour incident:", updateError)
      return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    console.log("✅ [API INCIDENT PHOTOS] Photos ajoutées avec succès:", newPhotoUrls.length)

    return NextResponse.json({
      success: true,
      message: `${newPhotoUrls.length} photo(s) ajoutée(s) avec succès`,
      photos: newPhotoUrls
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })

  } catch (error) {
    console.error("❌ [API INCIDENT PHOTOS] Erreur serveur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
