import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Listage des documents disponibles...")

    // Récupérer tous les dossiers de location pour voir les URLs blob
    const { data: rentalFiles, error } = await supabase
      .from("rental_files")
      .select("id, main_tenant, guarantors")
      .limit(10)

    if (error) {
      throw error
    }

    const documentUrls = new Set()
    let totalDocuments = 0

    // Extraire toutes les URLs de documents
    rentalFiles.forEach((file) => {
      // Documents du locataire principal
      if (file.main_tenant) {
        const tenant = file.main_tenant

        // Pièces d'identité
        if (tenant.identity_documents) {
          tenant.identity_documents.forEach((doc) => {
            documentUrls.add(doc)
            totalDocuments++
          })
        }

        // Documents d'activité
        if (tenant.activity_documents) {
          tenant.activity_documents.forEach((doc) => {
            documentUrls.add(doc)
            totalDocuments++
          })
        }

        // Documents de revenus
        if (tenant.income_sources?.work_income?.documents) {
          tenant.income_sources.work_income.documents.forEach((doc) => {
            documentUrls.add(doc)
            totalDocuments++
          })
        }

        // Documents fiscaux
        if (tenant.tax_situation?.documents) {
          tenant.tax_situation.documents.forEach((doc) => {
            documentUrls.add(doc)
            totalDocuments++
          })
        }

        // Documents de logement
        if (tenant.current_housing_documents?.quittances_loyer) {
          tenant.current_housing_documents.quittances_loyer.forEach((doc) => {
            documentUrls.add(doc)
            totalDocuments++
          })
        }
      }

      // Documents des garants
      if (file.guarantors) {
        file.guarantors.forEach((guarantor) => {
          if (guarantor.personal_info?.identity_documents) {
            guarantor.personal_info.identity_documents.forEach((doc) => {
              documentUrls.add(doc)
              totalDocuments++
            })
          }
        })
      }
    })

    // Tester l'accessibilité de quelques documents
    const documentTests = []
    const urlArray = Array.from(documentUrls).slice(0, 5) // Tester les 5 premiers

    for (const url of urlArray) {
      try {
        const response = await fetch(url, { method: "HEAD" })
        documentTests.push({
          url,
          accessible: response.ok,
          status: response.status,
          type: response.headers.get("content-type"),
        })
      } catch (error) {
        documentTests.push({
          url,
          accessible: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      total_rental_files: rentalFiles.length,
      total_documents: totalDocuments,
      unique_document_urls: documentUrls.size,
      document_tests: documentTests,
      sample_urls: Array.from(documentUrls).slice(0, 10),
      storage_type: "Vercel Blob Storage",
      note: "Les documents sont stockés dans Vercel Blob Storage, pas Supabase Storage",
    })
  } catch (error) {
    console.error("❌ Erreur listage documents:", error)
    return NextResponse.json(
      {
        error: error.message,
        total_documents: 0,
        note: "Erreur lors de la récupération des documents",
      },
      { status: 500 },
    )
  }
}
