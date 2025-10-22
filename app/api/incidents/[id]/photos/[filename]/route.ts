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

    // Récupérer l'incident pour obtenir les URLs des photos
    const { data: incident, error: incidentError } = await server
      .from("incidents")
      .select("photos")
      .eq("id", incidentId)
      .single()

    if (incidentError || !incident) {
      console.error("❌ [PHOTOS API] Incident non trouvé:", incidentError)
      return NextResponse.json({ error: "Incident non trouvé" }, { status: 404 })
    }

    // Les photos sont stockées avec des URLs publiques complètes
    // Si on a des URLs publiques, rediriger vers la première disponible
    if (incident.photos && incident.photos.length > 0) {
      const publicUrl = incident.photos.find(url => url.includes('supabase.co/storage/v1/object/public'))
      if (publicUrl) {
        console.log("✅ [PHOTOS API] Redirection vers URL publique:", publicUrl)
        return NextResponse.redirect(publicUrl)
      }
    }
    
    console.error("❌ [PHOTOS API] Aucune photo publique trouvée pour l'incident:", incidentId)
    console.log("📸 [PHOTOS API] URLs disponibles:", incident.photos)
    return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 })

    // Sinon, essayer de récupérer depuis le storage
    const tryDownload = async (bucket: string, path: string) => {
      const res = await server.storage.from(bucket).download(path)
      return res
    }

    let downloadRes = await tryDownload("documents", `incidents/${incidentId}/${filename}`)

    if ((downloadRes as any).error) {
      downloadRes = await tryDownload("documents", `incidents/${filename}`)
    }

    if ((downloadRes as any).error) {
      downloadRes = await tryDownload("documents", filename)
    }

    if ((downloadRes as any).error) {
      console.error("❌ [PHOTOS API] Photo non trouvée dans le storage:", filename)
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 })
    }

    const data = (downloadRes as any).data

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
