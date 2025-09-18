import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// POST /api/leases/[id]/etat-des-lieux/photos
// Upload des photos pour l'état des lieux numérique
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const formData = await request.formData()
    const roomId = formData.get('roomId') as string
    const photos = formData.getAll('photos') as File[]
    
    if (!roomId || photos.length === 0) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const server = createServerClient()
    const photoUrls: string[] = []

    // Upload chaque photo vers Supabase Storage
    for (const photo of photos) {
      const fileName = `${leaseId}/${roomId}/${Date.now()}-${photo.name}`
      
      const { data, error } = await server.storage
        .from('documents')
        .upload(fileName, photo, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error("Erreur upload photo:", error)
        continue
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = server.storage
        .from('documents')
        .getPublicUrl(fileName)

      photoUrls.push(publicUrl)
    }

    return NextResponse.json({ photoUrls })
  } catch (error) {
    console.error("Erreur upload photos:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
