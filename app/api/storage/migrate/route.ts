import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    console.log("🔄 Début de la migration des documents...")

    // Récupérer tous les dossiers avec des URLs blob temporaires
    const { data: rentalFiles, error } = await supabase.from("rental_files").select("*")

    if (error) {
      throw error
    }

    console.log(`📋 ${rentalFiles?.length || 0} dossiers à analyser`)

    let migratedCount = 0
    let errorCount = 0
    const migrationResults = []

    for (const file of rentalFiles || []) {
      try {
        console.log(`🔍 Analyse dossier ${file.id}`)

        // Analyser et remplacer les URLs blob temporaires
        let needsUpdate = false
        const updatedFile = { ...file }

        // Fonction pour remplacer les URLs blob
        const replaceBlobUrls = (documents: string[]) => {
          return documents.map((url) => {
            if (url.includes("blob:")) {
              needsUpdate = true
              // Pour l'instant, on remplace par un placeholder
              // En production, il faudrait uploader le fichier vers Vercel Blob
              return `/placeholder.svg?height=400&width=300&query=Document migré - ${url.split("/").pop()}`
            }
            return url
          })
        }

        // Traiter le locataire principal
        if (file.main_tenant) {
          if (file.main_tenant.identity_documents) {
            updatedFile.main_tenant.identity_documents = replaceBlobUrls(file.main_tenant.identity_documents)
          }
          if (file.main_tenant.activity_documents) {
            updatedFile.main_tenant.activity_documents = replaceBlobUrls(file.main_tenant.activity_documents)
          }
          if (file.main_tenant.tax_situation?.documents) {
            updatedFile.main_tenant.tax_situation.documents = replaceBlobUrls(file.main_tenant.tax_situation.documents)
          }
          if (file.main_tenant.income_sources?.work_income?.documents) {
            updatedFile.main_tenant.income_sources.work_income.documents = replaceBlobUrls(
              file.main_tenant.income_sources.work_income.documents,
            )
          }
          if (file.main_tenant.current_housing_documents?.quittances_loyer) {
            updatedFile.main_tenant.current_housing_documents.quittances_loyer = replaceBlobUrls(
              file.main_tenant.current_housing_documents.quittances_loyer,
            )
          }
        }

        // Traiter les garants
        if (file.guarantors) {
          updatedFile.guarantors = file.guarantors.map((guarantor: any) => {
            if (guarantor.personal_info?.identity_documents) {
              guarantor.personal_info.identity_documents = replaceBlobUrls(guarantor.personal_info.identity_documents)
            }
            return guarantor
          })
        }

        // Mettre à jour si nécessaire
        if (needsUpdate) {
          const { error: updateError } = await supabase.from("rental_files").update(updatedFile).eq("id", file.id)

          if (updateError) {
            throw updateError
          }

          migratedCount++
          migrationResults.push({
            id: file.id,
            status: "migrated",
            message: "URLs blob remplacées par des placeholders",
          })
          console.log(`✅ Dossier ${file.id} migré`)
        } else {
          migrationResults.push({
            id: file.id,
            status: "skipped",
            message: "Aucune URL blob trouvée",
          })
          console.log(`⏭️ Dossier ${file.id} ignoré (pas d'URL blob)`)
        }
      } catch (fileError) {
        errorCount++
        migrationResults.push({
          id: file.id,
          status: "error",
          message: fileError.message,
        })
        console.error(`❌ Erreur dossier ${file.id}:`, fileError)
      }
    }

    console.log(`🎉 Migration terminée: ${migratedCount} migrés, ${errorCount} erreurs`)

    return NextResponse.json({
      success: true,
      migrated_count: migratedCount,
      error_count: errorCount,
      total_files: rentalFiles?.length || 0,
      results: migrationResults,
      message: "Migration terminée - URLs blob remplacées par des placeholders",
      note: "Pour une vraie migration, il faudrait uploader les fichiers vers Vercel Blob Storage",
    })
  } catch (error) {
    console.error("❌ Erreur migration:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la migration",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
