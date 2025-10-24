import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { user, resetUrl } = await request.json()

    if (!user || !resetUrl) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    console.log("📧 Envoi email de réinitialisation de mot de passe pour:", user.email)

    // Récupérer les paramètres du site
    const supabase = createServerClient()
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "site_info")
      .single()

    const siteInfo = siteSettings?.setting_value || {
      title: "Louer Ici",
      description: "La plateforme qui simplifie la location immobilière"
    }

    // Récupérer le logo
    const { data: logoData } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "logos")
      .single()

    const logos = logoData?.setting_value || {}
    const logoUrl = logos?.main || null

    // Préparer les données pour l'email
    const emailData = {
      to: user.email,
      subject: `Réinitialisation de votre mot de passe - ${siteInfo.title}`,
      template: "password-reset",
      data: {
        user: {
          email: user.email,
          first_name: user.first_name || 'Utilisateur'
        },
        siteInfo,
        logoUrl,
        resetUrl,
        expiresIn: "24 heures"
      }
    }

    // Envoyer l'email
    const result = await emailService.sendEmail(emailData)

    if (!result.success) {
      throw new Error(result.error || "Erreur envoi email")
    }

    console.log("✅ Email de réinitialisation de mot de passe envoyé avec succès")

    return NextResponse.json({ 
      success: true, 
      message: "Email de réinitialisation envoyé" 
    })
  } catch (error) {
    console.error("❌ Erreur envoi email de réinitialisation:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}
