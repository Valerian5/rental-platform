import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const documentName = params.name
    console.log("🔍 Récupération document:", documentName)

    // Si c'est une URL blob encodée, on la décode
    const cleanName = decodeURIComponent(documentName)
    console.log("🔍 Nom décodé:", cleanName)

    // Si c'est une URL blob complète, on extrait juste l'ID
    let documentId = cleanName
    if (cleanName.includes("blob:")) {
      const urlParts = cleanName.split("/")
      documentId = urlParts[urlParts.length - 1]
    }

    console.log("🔍 ID du document:", documentId)

    // Récupérer le document depuis Supabase Storage
    try {
      // D'abord, essayer de récupérer depuis le bucket 'documents'
      const { data: documentData, error: downloadError } = await supabase.storage.from("documents").download(documentId)

      if (downloadError) {
        console.log("⚠️ Erreur téléchargement depuis 'documents':", downloadError.message)

        // Essayer depuis le bucket 'rental-files' si 'documents' échoue
        const { data: rentalFileData, error: rentalFileError } = await supabase.storage
          .from("rental-files")
          .download(documentId)

        if (rentalFileError) {
          console.log("⚠️ Erreur téléchargement depuis 'rental-files':", rentalFileError.message)
          throw new Error("Document non trouvé dans les buckets de stockage")
        }

        console.log("✅ Document trouvé dans 'rental-files'")
        return new NextResponse(rentalFileData, {
          headers: {
            "Content-Type": rentalFileData.type || "application/octet-stream",
            "Content-Disposition": `inline; filename="${documentId}"`,
            "Cache-Control": "public, max-age=3600",
          },
        })
      }

      console.log("✅ Document trouvé dans 'documents'")
      return new NextResponse(documentData, {
        headers: {
          "Content-Type": documentData.type || "application/octet-stream",
          "Content-Disposition": `inline; filename="${documentId}"`,
          "Cache-Control": "public, max-age=3600",
        },
      })
    } catch (storageError) {
      console.log("⚠️ Erreur stockage:", storageError)

      // Si le document n'est pas trouvé dans le stockage, essayer de récupérer l'URL publique
      try {
        const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(documentId)

        if (publicUrlData?.publicUrl) {
          console.log("🔗 Redirection vers URL publique:", publicUrlData.publicUrl)
          return NextResponse.redirect(publicUrlData.publicUrl)
        }
      } catch (publicUrlError) {
        console.log("⚠️ Erreur URL publique:", publicUrlError)
      }

      // Dernière tentative : chercher dans la base de données si le document existe
      try {
        const { data: dbData, error: dbError } = await supabase
          .from("rental_files")
          .select("main_tenant, guarantors")
          .or(
            `main_tenant->>identity_documents.cs.{${documentId}},` +
              `main_tenant->>activity_documents.cs.{${documentId}},` +
              `main_tenant->income_sources->work_income->>documents.cs.{${documentId}},` +
              `main_tenant->tax_situation->>documents.cs.{${documentId}},` +
              `main_tenant->current_housing_documents->>quittances_loyer.cs.{${documentId}}`,
          )
          .limit(1)

        if (dbData && dbData.length > 0) {
          console.log("📄 Document référencé en base mais fichier manquant")

          // Générer un placeholder indiquant que le document existe mais n'est pas accessible
          const placeholderUrl = `/placeholder.svg?height=600&width=400&query=Document ${documentId.substring(0, 8)} - Fichier temporairement indisponible`
          return NextResponse.redirect(new URL(placeholderUrl, request.url))
        }
      } catch (dbError) {
        console.log("⚠️ Erreur recherche en base:", dbError)
      }

      throw new Error("Document introuvable")
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du document:", error)

    // Retourner une image d'erreur
    const errorPlaceholder = `/placeholder.svg?height=400&width=300&query=Document non disponible - ${error.message}`
    return NextResponse.redirect(new URL(errorPlaceholder, request.url))
  }
}
