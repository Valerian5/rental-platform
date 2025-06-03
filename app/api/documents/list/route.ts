import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    console.log("🔍 Analyse des documents dans la base de données...")

    // Récupérer tous les dossiers de location pour analyser les URLs
    const { data: rentalFiles, error } = await supabase.from("rental_files").select("*")

    if (error) {
      console.error("❌ Erreur Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`📋 ${rentalFiles?.length || 0} dossiers trouvés`)

    // Extraire toutes les URLs de documents
    const allDocumentUrls = new Set<string>()
    let totalDocuments = 0

    if (rentalFiles) {
      for (const file of rentalFiles) {
        // Analyser le locataire principal
        if (file.main_tenant) {
          const tenant = file.main_tenant

          // Documents d'identité
          if (tenant.identity_documents) {
            tenant.identity_documents.forEach((url: string) => {
              allDocumentUrls.add(url)
              totalDocuments++
            })
          }

          // Documents d'activité
          if (tenant.activity_documents) {
            tenant.activity_documents.forEach((url: string) => {
              allDocumentUrls.add(url)
              totalDocuments++
            })
          }

          // Documents fiscaux
          if (tenant.tax_situation?.documents) {
            tenant.tax_situation.documents.forEach((url: string) => {
              allDocumentUrls.add(url)
              totalDocuments++
            })
          }

          // Documents de revenus
          if (tenant.income_sources?.work_income?.documents) {
            tenant.income_sources.work_income.documents.forEach((url: string) => {
              allDocumentUrls.add(url)
              totalDocuments++
            })
          }

          // Documents de logement
          if (tenant.current_housing_documents?.quittances_loyer) {
            tenant.current_housing_documents.quittances_loyer.forEach((url: string) => {
              allDocumentUrls.add(url)
              totalDocuments++
            })
          }
        }

        // Analyser les garants
        if (file.guarantors) {
          for (const guarantor of file.guarantors) {
            if (guarantor.personal_info?.identity_documents) {
              guarantor.personal_info.identity_documents.forEach((url: string) => {
                allDocumentUrls.add(url)
                totalDocuments++
              })
            }
          }
        }
      }
    }

    console.log(`📊 ${totalDocuments} documents au total, ${allDocumentUrls.size} URLs uniques`)

    // Analyser les types d'URLs
    const urlAnalysis = {
      vercel_blob: 0,
      supabase_storage: 0,
      other: 0,
    }

    const documentsList = Array.from(allDocumentUrls).map((url) => {
      let type = "other"
      if (url.includes("blob:")) {
        type = "vercel_blob"
        urlAnalysis.vercel_blob++
      } else if (url.includes("supabase")) {
        type = "supabase_storage"
        urlAnalysis.supabase_storage++
      } else {
        urlAnalysis.other++
      }

      return {
        url,
        type,
        name: url.split("/").pop() || "Document",
      }
    })

    return NextResponse.json({
      total_files: totalDocuments,
      unique_urls: allDocumentUrls.size,
      url_analysis: urlAnalysis,
      documents_bucket: {
        count: urlAnalysis.supabase_storage,
        files: documentsList.filter((d) => d.type === "supabase_storage"),
        error: urlAnalysis.supabase_storage === 0 ? "Aucun document Supabase trouvé" : null,
      },
      rental_files_bucket: {
        count: urlAnalysis.vercel_blob,
        files: documentsList.filter((d) => d.type === "vercel_blob"),
        error: urlAnalysis.vercel_blob === 0 ? "Aucun document Vercel Blob trouvé" : null,
      },
      all_documents: documentsList,
      success: true,
    })
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse des documents:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de l'analyse des documents",
        details: error.message,
        total_files: 0,
        documents_bucket: { count: 0, files: [], error: "Erreur serveur" },
        rental_files_bucket: { count: 0, files: [], error: "Erreur serveur" },
      },
      { status: 500 },
    )
  }
}
