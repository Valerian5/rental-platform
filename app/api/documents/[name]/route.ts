import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const documentName = params.name
    console.log("📄 Récupération document:", documentName)

    // Décoder l'URL si elle est encodée
    const decodedUrl = decodeURIComponent(documentName)
    console.log("🔗 URL décodée:", decodedUrl)

    // Si c'est une URL blob Vercel, on essaie de la récupérer directement
    if (decodedUrl.includes("blob:")) {
      console.log("🔵 URL Vercel Blob détectée")

      // Pour les URLs blob, on ne peut pas les récupérer directement côté serveur
      // On retourne une erreur explicative
      return NextResponse.json(
        {
          error: "Les URLs blob ne peuvent pas être récupérées côté serveur",
          suggestion: "Utilisez l'URL directement côté client",
          url: decodedUrl,
        },
        { status: 400 },
      )
    }

    // Si c'est une URL normale, on essaie de la récupérer
    try {
      console.log("🌐 Tentative de récupération HTTP:", decodedUrl)
      const response = await fetch(decodedUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream"
      const buffer = await response.arrayBuffer()

      console.log("✅ Document récupéré:", buffer.byteLength, "bytes, type:", contentType)

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      })
    } catch (fetchError) {
      console.error("❌ Erreur récupération HTTP:", fetchError)
      return NextResponse.json(
        {
          error: "Impossible de récupérer le document",
          details: fetchError.message,
          url: decodedUrl,
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
