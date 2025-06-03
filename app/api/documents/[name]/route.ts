import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const documentName = params.name
    console.log("🔍 Récupération document:", documentName)

    // Décoder l'URL si elle est encodée
    const cleanName = decodeURIComponent(documentName)
    console.log("🔍 Nom décodé:", cleanName)

    // Si c'est une URL blob complète, on l'utilise directement
    if (cleanName.includes("blob:https://")) {
      console.log("🔗 URL blob détectée, redirection directe")

      try {
        // Essayer de récupérer le contenu depuis l'URL blob
        const response = await fetch(cleanName)

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const blob = await response.blob()
        console.log("✅ Blob récupéré:", blob.type, blob.size, "bytes")

        // Déterminer le type de contenu
        let contentType = blob.type || "application/octet-stream"
        if (!contentType || contentType === "application/octet-stream") {
          // Essayer de deviner le type basé sur l'extension ou le contenu
          if (cleanName.includes("image") || blob.type.startsWith("image/")) {
            contentType = "image/jpeg"
          } else if (cleanName.includes("pdf")) {
            contentType = "application/pdf"
          }
        }

        // Retourner le contenu du blob
        const arrayBuffer = await blob.arrayBuffer()
        return new NextResponse(arrayBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="document"`,
            "Cache-Control": "public, max-age=3600",
          },
        })
      } catch (fetchError) {
        console.error("❌ Erreur récupération blob:", fetchError)

        // Si on ne peut pas récupérer le blob, rediriger vers l'URL directement
        return NextResponse.redirect(cleanName)
      }
    }

    // Si c'est juste un ID, essayer de construire l'URL blob
    let documentId = cleanName
    if (cleanName.includes("/")) {
      const urlParts = cleanName.split("/")
      documentId = urlParts[urlParts.length - 1]
    }

    // Construire l'URL blob probable
    const blobUrl = `https://rental-platform-h5sj.vercel.app/${documentId}`
    console.log("🔗 URL blob construite:", blobUrl)

    try {
      const response = await fetch(blobUrl)

      if (!response.ok) {
        throw new Error(`Document non trouvé: ${response.status}`)
      }

      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()

      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": blob.type || "image/jpeg",
          "Content-Disposition": `inline; filename="${documentId}"`,
          "Cache-Control": "public, max-age=3600",
        },
      })
    } catch (blobError) {
      console.error("❌ Erreur récupération depuis URL construite:", blobError)

      // Dernière tentative : générer un placeholder
      const placeholderUrl = `/placeholder.svg?height=600&width=400&query=Document ${documentId.substring(0, 8)} - Fichier temporairement indisponible`
      return NextResponse.redirect(new URL(placeholderUrl, request.url))
    }
  } catch (error) {
    console.error("❌ Erreur générale:", error)

    // Retourner une image d'erreur
    const errorPlaceholder = `/placeholder.svg?height=400&width=300&query=Document non disponible - ${error.message}`
    return NextResponse.redirect(new URL(errorPlaceholder, request.url))
  }
}
