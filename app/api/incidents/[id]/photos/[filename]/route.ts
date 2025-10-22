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

    // Chercher la photo correspondante dans les URLs stockées
    // Les photos sont stockées avec des URLs complètes, on cherche par nom de fichier
    const photoUrl = incident.photos?.find((url: string) => {
      // Extraire le nom de fichier de l'URL
      const urlFilename = url.split('/').pop()?.split('?')[0] // Enlever les paramètres de query
      return urlFilename === filename || url.includes(filename)
    })
    
    if (!photoUrl) {
      console.error("❌ [PHOTOS API] Photo non trouvée dans l'incident:", filename)
      console.log("📸 [PHOTOS API] URLs disponibles:", incident.photos)
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 })
    }

    // Si c'est déjà une URL publique Supabase, rediriger directement
    if (photoUrl.includes('supabase.co/storage/v1/object/public')) {
      return NextResponse.redirect(photoUrl)
    }

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
