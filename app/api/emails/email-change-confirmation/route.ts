import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { user, oldEmail } = await request.json()

    if (!user || !oldEmail) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    console.log("📧 Envoi email de confirmation de changement d'email pour:", user.email)

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
      subject: `Confirmez votre nouvelle adresse email - ${siteInfo.title}`,
      template: "email-change-confirmation",
      data: {
        user: {
          email: user.email,
          first_name: user.first_name || 'Utilisateur'
        },
        siteInfo,
        logoUrl,
        verificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=email_change`,
        oldEmail
      }
    }

    // Envoyer l'email
    const result = await emailService.sendEmail(emailData)

    if (!result.success) {
      throw new Error(result.error || "Erreur envoi email")
    }

    console.log("✅ Email de confirmation de changement d'email envoyé avec succès")

    return NextResponse.json({ 
      success: true, 
      message: "Email de confirmation de changement envoyé" 
    })
  } catch (error) {
    console.error("❌ Erreur envoi email de confirmation de changement:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}
