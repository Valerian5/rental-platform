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

    // Essayer de récupérer depuis plusieurs emplacements/buckets
    // 1) incident-photos/{incidentId}/{filename}
    // 2) incident-photos/{filename}
    // 3) fallback proxy vers /api/documents/{filename}

    const tryDownload = async (path: string) => {
      const res = await server.storage.from("incident-photos").download(path)
      return res
    }

    let downloadRes = await tryDownload(`${incidentId}/${filename}`)

    if ((downloadRes as any).error) {
      downloadRes = await tryDownload(`${filename}`)
    }

    if ((downloadRes as any).error) {
      // Fallback: proxy vers /api/documents/{filename}
      try {
        const url = new URL(request.url)
        url.pathname = `/api/documents/${filename}`
        const proxy = await fetch(url.toString())
        if (proxy.ok) {
          const blob = await proxy.arrayBuffer()
          return new NextResponse(Buffer.from(blob), {
            headers: {
              'Content-Type': proxy.headers.get('Content-Type') || 'application/octet-stream',
              'Content-Disposition': `inline; filename="${filename}"`,
              'Cache-Control': 'public, max-age=31536000',
            },
          })
        }
      } catch (e) {
        // ignore and continue to error out below
      }
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
