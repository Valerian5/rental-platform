import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { user, userType } = await request.json()

    if (!user || !userType) {
      return NextResponse.json({ success: false, error: "Données utilisateur manquantes" }, { status: 400 })
    }

    console.log("📧 Envoi email de bienvenue pour:", user.email, "Type:", userType)

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

    // Préparer les données pour l'email
    const emailData = {
      to: user.email,
      subject: `Bienvenue sur ${siteInfo.title} !`,
      template: "welcome",
      data: {
        user: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          user_type: user.user_type
        },
        userType,
        siteInfo,
        logoUrl,
        dashboardUrl: userType === "owner" 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/owner/dashboard`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/dashboard`,
        features: userType === "owner" 
          ? [
              "Publiez vos annonces en quelques clics",
              "Gérez les candidatures et visites",
              "Suivez vos locations et revenus",
              "Générez vos documents officiels"
            ]
          : [
              "Recherchez des logements adaptés",
              "Postulez facilement aux annonces",
              "Suivez vos candidatures en temps réel",
              "Gérez vos documents de location"
            ]
      }
    }

    // Envoyer l'email
    const result = await emailService.sendEmail(emailData)

    if (!result.success) {
      throw new Error(result.error || "Erreur envoi email")
    }

    console.log("✅ Email de bienvenue envoyé avec succès")

    return NextResponse.json({ 
      success: true, 
      message: "Email de bienvenue envoyé" 
    })
  } catch (error) {
    console.error("❌ Erreur envoi email de bienvenue:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}
