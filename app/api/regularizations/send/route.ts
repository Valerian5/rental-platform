import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServerClient } from '@/lib/supabase'
import { generateChargeRegularizationPDFBlob } from '@/lib/charge-regularization-pdf-generator'

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Utiliser le même client que le côté client, mais avec le token utilisateur
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { regularizationId, leaseId, year } = body

    if (!regularizationId || !leaseId || !year) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const supabaseAdmin = createServerClient()

    // Récupérer les données complètes
    const { data: regularization, error: regularizationError } = await supabaseAdmin
      .from('charge_regularizations_v2')
      .select(`
        *,
        expenses:charge_expenses(
          *,
          supporting_documents:charge_supporting_documents(*)
        )
      `)
      .eq('id', regularizationId)
      .eq('created_by', user.id)
      .single()

    if (regularizationError || !regularization) {
      console.log('Régularisation non trouvée:', regularizationError)
      return NextResponse.json({ error: "Régularisation non trouvée" }, { status: 404 })
    }

    const { data: lease, error: leaseError } = await supabaseAdmin
      .from('leases')
      .select(`
        *,
        property:properties(
          title,
          address,
          city
        ),
        tenant:users!leases_tenant_id_fkey(
          first_name,
          last_name,
          email
        ),
        owner:users!leases_owner_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', leaseId)
      .single()

    if (leaseError || !lease) {
      console.log('Bail non trouvé:', leaseError)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    if (lease.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Générer le PDF
    const { generateChargeRegularizationPDF } = await import('@/lib/charge-regularization-pdf-generator')
    const pdf = generateChargeRegularizationPDF(lease, regularization)
    
    // Convertir en buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Uploader le PDF dans le storage
    const fileName = `regularisation-charges-${year}-${Date.now()}.pdf`
    const filePath = `tenant-documents/${lease.tenant.id}/${fileName}`
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload PDF:', uploadError)
      return NextResponse.json({ error: "Erreur upload PDF" }, { status: 500 })
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath)

      // Créer une notification pour le locataire
      console.log('🔔 Création notification pour locataire:', lease.tenant.id)
      const notificationData = {
        regularization_id: regularizationId,
        lease_id: leaseId,
        year: year,
        pdf_url: publicUrl,
        balance: regularization.balance,
        balance_type: regularization.balance >= 0 ? 'refund' : 'additional_payment'
      }
      
      // Utiliser le service de notifications côté serveur
      try {
        const { notificationsService } = await import('@/lib/notifications-service')
        
        const notification = await notificationsService.createChargeRegularizationNotificationServer(
          lease.tenant.id,
          year,
          regularization.balance,
          publicUrl
        )
        
        console.log('✅ Notification créée avec succès:', notification.id)
      } catch (notificationError) {
        console.error('❌ Erreur création notification:', notificationError)
        // Ne pas échouer si la notification échoue
      }

    // Mettre à jour le statut de la régularisation
    const { error: updateError } = await supabaseAdmin
      .from('charge_regularizations_v2')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', regularizationId)

    if (updateError) {
      console.error('Erreur mise à jour statut:', updateError)
    }

    // Envoyer l'email au locataire
    try {
      const { sendChargeRegularizationEmail } = await import('@/lib/email-service')
      
      await sendChargeRegularizationEmail(
        {
          id: lease.tenant.id,
          name: `${lease.tenant.first_name} ${lease.tenant.last_name}`,
          email: lease.tenant.email
        },
        {
          id: lease.property.id,
          title: lease.property.title,
          address: lease.property.address
        },
        year,
        regularization.balance,
        regularization.balance >= 0 ? 'additional_payment' : 'refund',
        publicUrl
      )
      
      console.log(`✅ Email de régularisation envoyé à ${lease.tenant.email}`)
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError)
      // Ne pas faire échouer la requête si l'email échoue
    }

    return NextResponse.json({ 
      success: true,
      message: 'Régularisation envoyée au locataire',
      pdf_url: publicUrl
    })

  } catch (error) {
    console.error('Erreur envoi régularisation:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
