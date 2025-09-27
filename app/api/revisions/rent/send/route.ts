import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServerClient } from '@/lib/supabase'

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
    const { revisionId, leaseId, year } = body

    if (!revisionId || !leaseId || !year) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const supabaseAdmin = createServerClient()

    // Récupérer les données complètes
    const { data: revision, error: revisionError } = await supabaseAdmin
      .from('lease_revisions')
      .select(`
        *,
        lease:leases(
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
        )
      `)
      .eq('id', revisionId)
      .eq('created_by', user.id)
      .single()

    if (revisionError || !revision) {
      console.log('Révision non trouvée:', revisionError)
      return NextResponse.json({ error: "Révision non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    if (revision.lease.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Générer le PDF
    const { generateRentRevisionPDF } = await import('@/lib/rent-revision-pdf-generator')
    const pdf = generateRentRevisionPDF(revision.lease, revision)
    
    // Convertir en buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Uploader le PDF dans le storage
    const fileName = `revision-loyer-${year}-${Date.now()}.pdf`
    const filePath = `tenant-documents/${revision.lease.tenant.id}/${fileName}`
    
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
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: revision.lease.tenant.id,
        type: 'rent_revision',
        title: `Révision de loyer ${year}`,
        message: `Votre propriétaire vous a envoyé la révision de loyer pour l'année ${year}.`,
        data: {
          revision_id: revisionId,
          lease_id: leaseId,
          year: year,
          pdf_url: publicUrl,
          old_rent: revision.old_rent,
          new_rent: revision.new_rent,
          increase: revision.increase,
          increase_percentage: revision.increase_percentage
        },
        is_read: false
      })

    if (notificationError) {
      console.error('Erreur création notification:', notificationError)
    }

    // Mettre à jour le statut de la révision
    const { error: updateError } = await supabaseAdmin
      .from('lease_revisions')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', revisionId)

    if (updateError) {
      console.error('Erreur mise à jour statut:', updateError)
    }

    // Envoyer l'email au locataire
    try {
      const { sendRentRevisionEmail } = await import('@/lib/email-service')
      
      await sendRentRevisionEmail(
        {
          id: revision.lease.tenant.id,
          name: `${revision.lease.tenant.first_name} ${revision.lease.tenant.last_name}`,
          email: revision.lease.tenant.email
        },
        {
          id: revision.lease.property.id,
          title: revision.lease.property.title,
          address: revision.lease.property.address
        },
        year,
        revision.old_rent,
        revision.new_rent,
        revision.increase,
        revision.increase_percentage,
        publicUrl
      )
      
      console.log(`✅ Email de révision envoyé à ${revision.lease.tenant.email}`)
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError)
      // Ne pas faire échouer la requête si l'email échoue
    }

    return NextResponse.json({ 
      success: true,
      message: 'Révision envoyée au locataire',
      pdf_url: publicUrl
    })

  } catch (error) {
    console.error('Erreur envoi révision:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
