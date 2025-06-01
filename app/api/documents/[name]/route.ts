import { type NextRequest, NextResponse } from "next/server"

// Cette route simule l'accès à un document stocké
// Dans un environnement réel, vous récupéreriez le document depuis votre stockage (S3, Supabase Storage, etc.)
export async function GET(request: NextRequest, { params }: { params: { name: string } }): Promise<NextResponse> {
  try {
    const documentName = params.name

    // Simuler un délai de chargement
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Dans un environnement réel, vous récupéreriez le document depuis votre stockage
    // et vous renverriez le contenu binaire avec le bon Content-Type

    // Pour cette démonstration, nous redirigeons vers une image placeholder
    // qui représente le document demandé
    const placeholderUrl = `/placeholder.svg?height=800&width=600&query=Document: ${documentName}`

    // Dans un environnement réel, vous renverriez le document avec:
    // return new NextResponse(documentBuffer, {
    //   headers: {
    //     'Content-Type': getContentType(documentName),
    //     'Content-Disposition': `inline; filename="${documentName}"`,
    //   },
    // })

    // Pour cette démonstration, nous redirigeons vers le placeholder
    return NextResponse.redirect(new URL(placeholderUrl, request.url))
  } catch (error) {
    console.error("Erreur lors de la récupération du document:", error)
    return NextResponse.json({ error: "Impossible de récupérer le document" }, { status: 500 })
  }
}

// Fonction utilitaire pour déterminer le Content-Type en fonction de l'extension du fichier
function getContentType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "pdf":
      return "application/pdf"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "doc":
      return "application/msword"
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    default:
      return "application/octet-stream"
  }
}
