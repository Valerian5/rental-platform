import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-utils"

// POST /api/dossierfacile/webhook - Webhook DossierFacile Connect
export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Webhook DossierFacile Connect reçu")

    const body = await request.json()
    console.log("📋 Données webhook:", {
      partnerCallBackType: body.partnerCallBackType,
      applicationType: body.applicationType,
      status: body.status,
      onTenantId: body.onTenantId,
    })

    // Vérifier l'authentification du webhook (optionnel mais recommandé)
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.DOSSIERFACILE_WEBHOOK_API_KEY

    if (expectedApiKey && apiKey !== expectedApiKey) {
      console.error("❌ Clé API webhook invalide")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const server = createServerClient()

    // Traiter selon le type de callback
    switch (body.partnerCallBackType) {
      case 'CREATED_ACCOUNT':
        await handleCreatedAccount(body, server)
        break
      
      case 'VERIFIED_ACCOUNT':
        await handleVerifiedAccount(body, server)
        break
      
      case 'DENIED_ACCOUNT':
        await handleDeniedAccount(body, server)
        break
      
      case 'DELETED_ACCOUNT':
        await handleDeletedAccount(body, server)
        break
      
      case 'ACCESS_REVOKED':
        await handleAccessRevoked(body, server)
        break
      
      case 'APPLICATION_TYPE_CHANGED':
        await handleApplicationTypeChanged(body, server)
        break
      
      case 'ARCHIVED_ACCOUNT':
      case 'RETURNED_ACCOUNT':
        await handleArchivedAccount(body, server)
        break
      
      case 'MERGED_ACCOUNT':
        await handleMergedAccount(body, server)
        break
      
      default:
        console.log("⚠️ Type de callback non géré:", body.partnerCallBackType)
    }

    console.log("✅ Webhook traité avec succès")
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("❌ Erreur traitement webhook DossierFacile:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// Gérer la création d'un compte
async function handleCreatedAccount(body: any, server: any) {
  console.log("📝 Compte DossierFacile créé:", body.onTenantId)
  
  // Mettre à jour le statut du dossier
  await server
    .from("dossierfacile_dossiers")
    .update({
      dossierfacile_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", body.onTenantId)
}

// Gérer la vérification d'un compte
async function handleVerifiedAccount(body: any, server: any) {
  console.log("✅ Compte DossierFacile vérifié:", body.onTenantId)
  
  // Mettre à jour le statut et les URLs
  await server
    .from("dossierfacile_dossiers")
    .update({
      dossierfacile_status: "verified",
      dossierfacile_verified_at: new Date().toISOString(),
      dossierfacile_pdf_url: body.dossierPdfUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", body.onTenantId)
}

// Gérer le refus d'un compte
async function handleDeniedAccount(body: any, server: any) {
  console.log("❌ Compte DossierFacile refusé:", body.onTenantId)
  
  await server
    .from("dossierfacile_dossiers")
    .update({
      dossierfacile_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", body.onTenantId)
}

// Gérer la suppression d'un compte
async function handleDeletedAccount(body: any, server: any) {
  console.log("🗑️ Compte DossierFacile supprimé:", body.onTenantId)
  
  await server
    .from("dossierfacile_dossiers")
    .delete()
    .eq("tenant_id", body.onTenantId)
}

// Gérer la révocation d'accès
async function handleAccessRevoked(body: any, server: any) {
  console.log("🚫 Accès DossierFacile révoqué:", body.onTenantId)
  
  await server
    .from("dossierfacile_dossiers")
    .update({
      dossierfacile_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", body.onTenantId)
}

// Gérer le changement de type d'application
async function handleApplicationTypeChanged(body: any, server: any) {
  console.log("🔄 Type d'application changé:", body.onTenantId, "->", body.applicationType)
  
  // Mettre à jour les données avec le nouveau type
  await server
    .from("dossierfacile_dossiers")
    .update({
      dossierfacile_data: {
        application_type: body.applicationType,
        updated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", body.onTenantId)
}

// Gérer l'archivage d'un compte
async function handleArchivedAccount(body: any, server: any) {
  console.log("📦 Compte DossierFacile archivé:", body.onTenantId)
  
  await server
    .from("dossierfacile_dossiers")
    .update({
      dossierfacile_status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", body.onTenantId)
}

// Gérer la fusion de comptes
async function handleMergedAccount(body: any, server: any) {
  console.log("🔀 Comptes DossierFacile fusionnés:", body.onTenantId)
  
  // Logique de fusion si nécessaire
  // Pour l'instant, on met juste à jour le timestamp
  await server
    .from("dossierfacile_dossiers")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", body.onTenantId)
}
