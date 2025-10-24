import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { email, userType, token } = await request.json()

    if (!email || !userType) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    console.log("📧 Envoi email de vérification personnalisé pour:", email, "Type:", userType)

    // Récupérer les paramètres du site pour le logo et les informations
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

    // Construire l'URL de vérification
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?token=${token}&type=signup&user_type=${userType}`

    // Préparer les données pour l'email
    const emailData = {
      to: email,
      subject: `Confirmez votre adresse email - ${siteInfo.title}`,
      template: "verify-email",
      data: {
        user: {
          email: email,
          user_type: userType
        },
        userType,
        siteInfo,
        logoUrl,
        verificationUrl,
        dashboardUrl: userType === "owner" 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/owner/dashboard`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/dashboard`
      }
    }

    // Envoyer l'email
    const result = await emailService.sendEmail(emailData)

    if (!result.success) {
      throw new Error(result.error || "Erreur envoi email")
    }

    console.log("✅ Email de vérification personnalisé envoyé avec succès")

    return NextResponse.json({ 
      success: true, 
      message: "Email de vérification envoyé" 
    })
  } catch (error) {
    console.error("❌ Erreur envoi email de vérification personnalisé:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}
