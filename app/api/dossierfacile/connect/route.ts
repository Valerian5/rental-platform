import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-utils"

// GET /api/dossierfacile/connect - Initier la connexion DossierFacile Connect
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log("🔗 Initiation connexion DossierFacile Connect pour:", user.id)

    // Construire l'URL d'autorisation DossierFacile Connect
    const authUrl = process.env.NODE_ENV === "production"
      ? "https://sso.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/auth"
      : "https://sso-preprod.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/auth"

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/dossierfacile/callback`
    
    // Générer un state unique pour la sécurité (utiliser l'ID utilisateur)
    const state = user.id

    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: process.env.DOSSIERFACILE_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: "openid",
      state: state,
      // Optionnel: pré-remplir l'email si disponible
      ...(user.email && { login_hint: user.email }),
    })

    const fullAuthUrl = `${authUrl}?${authParams.toString()}`

    console.log("🔗 Redirection vers DossierFacile Connect:", fullAuthUrl)

    // Rediriger vers DossierFacile Connect
    return NextResponse.redirect(fullAuthUrl)

  } catch (error) {
    console.error("❌ Erreur initiation DossierFacile Connect:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}
