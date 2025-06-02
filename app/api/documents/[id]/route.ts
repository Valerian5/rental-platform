import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id
    console.log("🔍 Récupération document ID:", documentId)

    // Si c'est une URL blob complète, on extrait juste l'ID
    let cleanId = documentId
    if (documentId.includes("blob:")) {
      const urlParts = documentId.split("/")
      cleanId = urlParts[urlParts.length - 1]
    }

    // Dans un environnement réel, vous récupéreriez le document depuis votre stockage
    // Pour cette démonstration, nous allons créer un placeholder basé sur l'ID

    // Simuler différents types de documents
    const documentTypes = [
      "carte-identite",
      "passeport",
      "justificatif-revenus",
      "contrat-travail",
      "avis-imposition",
      "quittance-loyer",
    ]

    const randomType = documentTypes[Math.floor(Math.random() * documentTypes.length)]

    // Créer une image placeholder qui ressemble à un vrai document
    const placeholderUrl = `/placeholder.svg?height=600&width=400&query=${randomType} document officiel avec tampon et signature`

    // Dans un environnement réel, vous feriez quelque chose comme :
    // const { data, error } = await supabase.storage
    //   .from('documents')
    //   .download(cleanId)
    //
    // if (error) throw error
    //
    // return new NextResponse(data, {
    //   headers: {
    //     'Content-Type': 'image/jpeg', // ou le type approprié
    //     'Content-Disposition': `inline; filename="${cleanId}"`,
    //   },
    // })

    // Pour la démonstration, on redirige vers le placeholder
    return NextResponse.redirect(new URL(placeholderUrl, request.url))
  } catch (error) {
    console.error("Erreur lors de la récupération du document:", error)

    // Retourner une image d'erreur
    const errorPlaceholder = `/placeholder.svg?height=400&width=300&query=Document non disponible - Erreur de chargement`
    return NextResponse.redirect(new URL(errorPlaceholder, request.url))
  }
}
