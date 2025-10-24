import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

// Vérifier la signature du webhook Supabase
function verifySignature(signature: string | null, body: string): boolean {
  if (!signature) return false
  
  // TODO: Implémenter la vérification de signature
  // Pour l'instant, on accepte tous les webhooks
  return true
}

// Handler pour l'inscription
async function handleSignupEmail(record: any) {
  console.log("📧 Webhook signup email:", record.email)
  
  try {
    // Récupérer les informations du site
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

    // Déterminer le type d'utilisateur
    const userType = record.raw_user_meta_data?.user_type || 'tenant'

    // Envoyer l'email de bienvenue
    const welcomeData = {
      to: record.email,
      subject: `Bienvenue sur ${siteInfo.title} !`,
      template: "welcome",
      data: {
        user: {
          first_name: record.raw_user_meta_data?.first_name || 'Utilisateur',
          last_name: record.raw_user_meta_data?.last_name || '',
          email: record.email,
          user_type: userType
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

    await emailService.sendEmail(welcomeData)

    // Envoyer l'email de vérification
    const verificationData = {
      to: record.email,
      subject: `Confirmez votre adresse email - ${siteInfo.title}`,
      template: "verify-email",
      data: {
        user: {
          email: record.email,
          user_type: userType
        },
        userType,
        siteInfo,
        logoUrl,
        verificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?user_type=${userType}`,
        dashboardUrl: userType === "owner" 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/owner/dashboard`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/dashboard`
      }
    }

    await emailService.sendEmail(verificationData)

    console.log("✅ Emails personnalisés envoyés pour:", record.email)
  } catch (error) {
    console.error("❌ Erreur envoi emails personnalisés:", error)
  }
}

// Handler pour le changement d'email
async function handleEmailChange(record: any) {
  console.log("📧 Webhook email change:", record.email)
  
  try {
    // Récupérer les informations du site
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

    // Envoyer l'email de confirmation de changement
    const emailData = {
      to: record.email,
      subject: `Confirmez votre nouvelle adresse email - ${siteInfo.title}`,
      template: "email-change-confirmation",
      data: {
        user: {
          email: record.email,
          first_name: record.raw_user_meta_data?.first_name || 'Utilisateur'
        },
        siteInfo,
        logoUrl,
        verificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=email_change`,
        oldEmail: record.old_record?.email || 'Ancienne adresse'
      }
    }

    await emailService.sendEmail(emailData)
    console.log("✅ Email de changement d'email envoyé pour:", record.email)
  } catch (error) {
    console.error("❌ Erreur envoi email de changement:", error)
  }
}

// Handler pour la réinitialisation de mot de passe
async function handlePasswordReset(record: any) {
  console.log("📧 Webhook password reset:", record.email)
  
  try {
    // Récupérer les informations du site
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

    // Envoyer l'email de réinitialisation
    const emailData = {
      to: record.email,
      subject: `Réinitialisation de votre mot de passe - ${siteInfo.title}`,
      template: "password-reset",
      data: {
        user: {
          email: record.email,
          first_name: record.raw_user_meta_data?.first_name || 'Utilisateur'
        },
        siteInfo,
        logoUrl,
        resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${record.id}`,
        expiresIn: "24 heures"
      }
    }

    await emailService.sendEmail(emailData)
    console.log("✅ Email de réinitialisation envoyé pour:", record.email)
  } catch (error) {
    console.error("❌ Erreur envoi email de réinitialisation:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-supabase-signature')
    
    // Vérifier la signature du webhook
    if (!verifySignature(signature, body)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, record, old_record } = JSON.parse(body)
    
    console.log("🔔 Webhook Supabase reçu:", type, record?.email)

    switch (type) {
      case 'INSERT':
        if (record.table === 'users') {
          await handleSignupEmail(record)
        }
        break
        
      case 'UPDATE':
        if (record.table === 'users') {
          // Vérifier si l'email a changé
          if (old_record?.email !== record.email) {
            await handleEmailChange({ ...record, old_record })
          }
          
          // Vérifier si c'est une demande de réinitialisation
          if (record.raw_user_meta_data?.reset_requested) {
            await handlePasswordReset(record)
          }
        }
        break
        
      default:
        console.log("📧 Type de webhook non géré:", type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur webhook Supabase:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
