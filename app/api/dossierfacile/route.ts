import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-utils"
import { dossierFacileService } from "@/lib/dossierfacile-service"

// GET /api/dossierfacile?tenant_id=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id requis" }, { status: 400 })
    }

    console.log("📋 API DossierFacile GET", { tenantId })

    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié et est le tenant
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (user.id !== tenantId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const dossierFacile = await dossierFacileService.getDossierFacileByTenant(tenantId)

    if (!dossierFacile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Aucun dossier DossierFacile trouvé",
      })
    }

    return NextResponse.json({
      success: true,
      data: dossierFacile,
    })
  } catch (error) {
    console.error("❌ Erreur API DossierFacile GET:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

// POST /api/dossierfacile - Créer un nouveau dossier DossierFacile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenant_id, verification_code } = body

    if (!tenant_id || !verification_code) {
      return NextResponse.json(
        { error: "tenant_id et verification_code requis" },
        { status: 400 }
      )
    }

    console.log("📋 API DossierFacile POST", { tenant_id, verification_code })

    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié et est le tenant
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (user.id !== tenant_id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Vérifier si un dossier DossierFacile existe déjà
    const existingDossier = await dossierFacileService.getDossierFacileByTenant(tenant_id)
    if (existingDossier) {
      return NextResponse.json(
        { error: "Un dossier DossierFacile existe déjà pour ce locataire" },
        { status: 409 }
      )
    }

    const dossierFacile = await dossierFacileService.createDossierFacile(tenant_id, verification_code)

    return NextResponse.json({
      success: true,
      data: dossierFacile,
      message: "Dossier DossierFacile créé avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API DossierFacile POST:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

// PUT /api/dossierfacile - Mettre à jour un dossier DossierFacile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenant_id, updates } = body

    if (!tenant_id || !updates) {
      return NextResponse.json(
        { error: "tenant_id et updates requis" },
        { status: 400 }
      )
    }

    console.log("📋 API DossierFacile PUT", { tenant_id, updates })

    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié et est le tenant
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (user.id !== tenant_id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const updatedDossier = await dossierFacileService.updateDossierFacile(tenant_id, updates)

    return NextResponse.json({
      success: true,
      data: updatedDossier,
      message: "Dossier DossierFacile mis à jour avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API DossierFacile PUT:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/dossierfacile - Supprimer un dossier DossierFacile
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id requis" }, { status: 400 })
    }

    console.log("📋 API DossierFacile DELETE", { tenantId })

    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié et est le tenant
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (user.id !== tenantId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    await dossierFacileService.deleteDossierFacile(tenantId)

    return NextResponse.json({
      success: true,
      message: "Dossier DossierFacile supprimé avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API DossierFacile DELETE:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}
