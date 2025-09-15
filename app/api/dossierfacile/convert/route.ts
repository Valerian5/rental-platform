import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-utils"
import { dossierFacileService } from "@/lib/dossierfacile-service"
import { rentalFileService } from "@/lib/rental-file-service"

// POST /api/dossierfacile/convert - Convertir un dossier DossierFacile en RentalFile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenant_id } = body

    if (!tenant_id) {
      return NextResponse.json(
        { error: "tenant_id requis" },
        { status: 400 }
      )
    }

    console.log("🔄 API DossierFacile Convert", { tenant_id })

    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié et est le tenant
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (user.id !== tenant_id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // 1. Récupérer le dossier DossierFacile
    const dossierFacile = await dossierFacileService.getDossierFacileByTenant(tenant_id)
    
    if (!dossierFacile) {
      return NextResponse.json(
        { error: "Aucun dossier DossierFacile trouvé" },
        { status: 404 }
      )
    }

    // 2. Convertir vers le format RentalFile
    const rentalFileData = dossierFacileService.convertToRentalFile(dossierFacile)

    // 3. Vérifier si un RentalFile existe déjà
    const existingRentalFile = await rentalFileService.getRentalFile(tenant_id)
    
    let rentalFile
    if (existingRentalFile) {
      // Mettre à jour le RentalFile existant
      rentalFile = await rentalFileService.updateRentalFile(tenant_id, {
        ...rentalFileData,
        // Préserver certaines données existantes
        presentation_message: existingRentalFile.presentation_message,
        rental_situation: existingRentalFile.rental_situation || "alone",
      })
    } else {
      // Créer un nouveau RentalFile
      rentalFile = await rentalFileService.createRentalFile(rentalFileData)
    }

    // 4. Mettre à jour le statut du dossier DossierFacile
    await dossierFacileService.updateDossierFacile(tenant_id, {
      dossierfacile_status: "converted",
    })

    return NextResponse.json({
      success: true,
      data: {
        rental_file: rentalFile,
        dossierfacile: dossierFacile,
      },
      message: "Dossier DossierFacile converti en RentalFile avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API DossierFacile Convert:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}
