import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const incidentId = params.id
    const filename = params.filename

    console.log("📸 [PHOTOS API] Récupération photo:", filename, "pour incident:", incidentId)

    const server = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer l'incident pour vérifier l'accès
    const { data: incident, error: incidentError } = await server
      .from("incidents")
      .select("id, photos")
      .eq("id", incidentId)
      .single()

    if (incidentError || !incident) {
      console.error("❌ [PHOTOS API] Incident non trouvé:", incidentError)
      return NextResponse.json({ error: "Incident non trouvé" }, { status: 404 })
    }

    // Vérifier que la photo existe dans la liste des photos de l'incident
    if (!incident.photos || !incident.photos.includes(filename)) {
      console.error("❌ [PHOTOS API] Photo non trouvée dans l'incident")
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 })
    }

    // Récupérer la photo depuis Supabase Storage
    const { data, error } = await server.storage
      .from("incident-photos")
      .download(`${incidentId}/${filename}`)

    if (error) {
      console.error("❌ [PHOTOS API] Erreur téléchargement photo:", error)
      return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 })
    }

    // Convertir le blob en ArrayBuffer
    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Déterminer le type MIME
    const extension = filename.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'pdf':
        contentType = 'application/pdf'
        break
    }

    console.log("✅ [PHOTOS API] Photo récupérée:", filename)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache pour 1 an
      },
    })
  } catch (error) {
    console.error("❌ [PHOTOS API] Erreur:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
