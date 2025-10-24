import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, resetUrl, user } = await request.json()

    if (!email || !resetUrl || !user) {
      return NextResponse.json(
        { error: 'Email, resetUrl et user sont requis' },
        { status: 400 }
      )
    }

    // Récupérer les paramètres du site
    const supabase = createServerClient()
    const { data: siteSettings, error: settingsError } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'site_info')
      .single()

    if (settingsError) {
      console.error('Erreur récupération paramètres site:', settingsError)
    }

    const siteInfo = siteSettings?.setting_value || {
      title: 'Louer Ici',
      description: 'Plateforme de gestion locative'
    }

    // Récupérer le logo
    const { data: logoData } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'logos')
      .single()

    const logoUrl = logoData?.setting_value?.main || null

    // Charger le template HTML
    const fs = require('fs')
    const path = require('path')
    const templatePath = path.join(process.cwd(), 'templates', 'emails', 'password-reset-custom.html')
    let template = fs.readFileSync(templatePath, 'utf8')

    // Remplacer les variables dans le template
    template = template.replace(/\{\{logoUrl\}\}/g, logoUrl || '')
    template = template.replace(/\{\{siteInfo\.title\}\}/g, siteInfo.title)
    template = template.replace(/\{\{siteInfo\.description\}\}/g, siteInfo.description)
    template = template.replace(/\{\{user\.first_name\}\}/g, user.first_name || '')
    template = template.replace(/\{\{user\.email\}\}/g, user.email)
    template = template.replace(/\{\{resetUrl\}\}/g, resetUrl)

    // Envoyer l'email
    const { data, error } = await resend.emails.send({
      from: `${siteInfo.title} <noreply@${process.env.RESEND_DOMAIN || 'louer-ici.com'}>`,
      to: [email],
      subject: `Réinitialisation de votre mot de passe - ${siteInfo.title}`,
      html: template,
    })

    if (error) {
      console.error('Erreur envoi email réinitialisation:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    console.log('Email de réinitialisation envoyé:', data)
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Erreur API email réinitialisation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}