import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-utils"
import { dossierFacileService } from "@/lib/dossierfacile-service"

// GET /api/dossierfacile/callback - Callback OAuth2 de DossierFacile Connect
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    console.log("🔄 Callback DossierFacile Connect", { code: !!code, state, error })

    // Vérifier s'il y a une erreur
    if (error) {
      console.error("❌ Erreur OAuth2 DossierFacile:", error)
      return NextResponse.redirect(
        new URL(`/tenant/profile/rental-file?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      console.error("❌ Code d'autorisation manquant")
      return NextResponse.redirect(
        new URL("/tenant/profile/rental-file?error=missing_code", request.url)
      )
    }

    // Vérifier l'état (state) pour la sécurité
    if (!state) {
      console.error("❌ State manquant")
      return NextResponse.redirect(
        new URL("/tenant/profile/rental-file?error=missing_state", request.url)
      )
    }

    // Récupérer l'utilisateur depuis le state (qui contient l'ID du tenant)
    const server = createServerClient()
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      console.error("❌ Utilisateur non authentifié")
      return NextResponse.redirect(
        new URL("/login?error=not_authenticated", request.url)
      )
    }

    // Construire l'URL de redirection
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/dossierfacile/callback`

    try {
      // 1. Échanger le code contre un token d'accès
      const tokens = await dossierFacileService.getAccessToken(code, redirectUri)
      
      // 2. Récupérer les données du profil
      const profileResponse = await dossierFacileService.getTenantProfile(tokens.access_token)
      
      if (!profileResponse.success || !profileResponse.data) {
        throw new Error("Erreur lors de la récupération du profil")
      }

      // 3. Extraire et structurer les données
      const extractedData = dossierFacileService.extractDossierFacileData(profileResponse.data)

      // 4. Sauvegarder en base de données
      const dossierData = {
        tenant_id: user.id,
        dossierfacile_id: profileResponse.data.id || `df_${Date.now()}`,
        dossierfacile_verification_code: state, // Utiliser le state comme code de référence
        dossierfacile_status: "verified",
        dossierfacile_verified_at: new Date().toISOString(),
        dossierfacile_data: extractedData,
        access_token: tokens.access_token, // Stocker temporairement pour les mises à jour
        refresh_token: tokens.refresh_token,
      }

      // Vérifier si un dossier existe déjà
      const existingDossier = await dossierFacileService.getDossierFacileByTenant(user.id)
      
      let savedDossier
      if (existingDossier) {
        // Mettre à jour le dossier existant
        savedDossier = await dossierFacileService.updateDossierFacile(user.id, dossierData)
      } else {
        // Créer un nouveau dossier
        const { data, error } = await server
          .from("dossierfacile_dossiers")
          .insert(dossierData)
          .select()
          .single()

        if (error) {
          console.error("❌ Erreur sauvegarde dossier:", error)
          throw new Error(error.message)
        }
        savedDossier = data
      }

      console.log("✅ Dossier DossierFacile Connect créé/mis à jour avec succès")

      // 5. Rediriger vers la page de profil avec succès
      return NextResponse.redirect(
        new URL("/tenant/profile/rental-file?dossierfacile=success", request.url)
      )

    } catch (error) {
      console.error("❌ Erreur traitement callback DossierFacile:", error)
      return NextResponse.redirect(
        new URL(`/tenant/profile/rental-file?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

  } catch (error) {
    console.error("❌ Erreur callback DossierFacile:", error)
    return NextResponse.redirect(
      new URL("/tenant/profile/rental-file?error=callback_error", request.url)
    )
  }
}
