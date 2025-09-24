import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      action,
      leaseId,
      propertyId,
      documentType, // 'amendment' | 'statement'
      documentUrl,
      documentFilename,
      message,
      sendEmail = true,
      saveToTenantSpace = true
    } = body

    if (action === 'send-document') {
      return await sendDocumentToTenant({
        userId: user.id,
        leaseId,
        propertyId,
        documentType,
        documentUrl,
        documentFilename,
        message,
        sendEmail,
        saveToTenantSpace
      })
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
  } catch (error) {
    console.error("Erreur API communication:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function sendDocumentToTenant(data: {
  userId: string
  leaseId: string
  propertyId: string
  documentType: 'amendment' | 'statement'
  documentUrl: string
  documentFilename: string
  message?: string
  sendEmail: boolean
  saveToTenantSpace: boolean
}) {
  try {
    // Récupérer les informations du bail et du locataire
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select(`
        id,
        property_id,
        tenant_id,
        property:properties(
          id,
          title,
          address,
          owner_id
        ),
        tenant:users!leases_tenant_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', data.leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    if (lease.property.owner_id !== data.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const results = []

    // 1. Envoyer par email si demandé
    if (data.sendEmail) {
      const emailResult = await sendDocumentEmail({
        tenant: lease.tenant,
        property: lease.property,
        documentType: data.documentType,
        documentUrl: data.documentUrl,
        documentFilename: data.documentFilename,
        message: data.message
      })
      results.push(emailResult)
    }

    // 2. Sauvegarder dans l'espace locataire si demandé
    if (data.saveToTenantSpace) {
      const spaceResult = await saveToTenantSpace({
        leaseId: data.leaseId,
        tenantId: lease.tenant_id,
        documentType: data.documentType,
        documentUrl: data.documentUrl,
        documentFilename: data.documentFilename,
        message: data.message
      })
      results.push(spaceResult)
    }

    // 3. Créer une notification
    const notificationResult = await createDocumentNotification({
      leaseId: data.leaseId,
      propertyId: data.propertyId,
      tenantId: lease.tenant_id,
      documentType: data.documentType,
      documentUrl: data.documentUrl,
      documentFilename: data.documentFilename
    })
    results.push(notificationResult)

    // 4. Mettre à jour le statut du document dans la base
    await updateDocumentStatus(data.leaseId, data.documentType, 'sent')

    return NextResponse.json({ 
      success: true, 
      results,
      message: "Document envoyé avec succès"
    })
  } catch (error) {
    console.error("Erreur envoi document:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }
}

async function sendDocumentEmail(data: {
  tenant: any
  property: any
  documentType: 'amendment' | 'statement'
  documentUrl: string
  documentFilename: string
  message?: string
}) {
  try {
    const documentTitle = data.documentType === 'amendment' 
      ? 'Avenant de bail - Révision de loyer' 
      : 'Décompte de charges locatives'

    const emailSubject = `${documentTitle} - ${data.property.title}`
    
    const emailBody = `
      <h2>${documentTitle}</h2>
      <p>Bonjour ${data.tenant.first_name} ${data.tenant.last_name},</p>
      
      <p>Veuillez trouver ci-joint le document concernant votre bail pour le logement :</p>
      <p><strong>${data.property.title}</strong><br>
      ${data.property.address}</p>
      
      ${data.message ? `<p>Message du propriétaire :<br><em>${data.message}</em></p>` : ''}
      
      <p>Ce document est également disponible dans votre espace locataire.</p>
      
      <p>Cordialement,<br>
      L'équipe Louer Ici</p>
    `

    // Ici, vous implémenteriez l'envoi d'email réel avec un service comme SendGrid, Resend, etc.
    console.log(`Envoi email à ${data.tenant.email}: ${emailSubject}`)
    console.log(`Document: ${data.documentUrl}`)

    return {
      type: 'email',
      success: true,
      recipient: data.tenant.email,
      subject: emailSubject
    }
  } catch (error) {
    console.error("Erreur envoi email:", error)
    return {
      type: 'email',
      success: false,
      error: error.message
    }
  }
}

async function saveToTenantSpace(data: {
  leaseId: string
  tenantId: string
  documentType: 'amendment' | 'statement'
  documentUrl: string
  documentFilename: string
  message?: string
}) {
  try {
    // Créer un enregistrement dans l'espace locataire
    const { data: document, error } = await supabase
      .from('tenant_documents')
      .insert({
        lease_id: data.leaseId,
        tenant_id: data.tenantId,
        document_type: data.documentType,
        document_url: data.documentUrl,
        document_filename: data.documentFilename,
        title: data.documentType === 'amendment' 
          ? 'Avenant de bail - Révision de loyer' 
          : 'Décompte de charges locatives',
        description: data.message || '',
        status: 'available',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur sauvegarde espace locataire:", error)
      return {
        type: 'tenant_space',
        success: false,
        error: error.message
      }
    }

    return {
      type: 'tenant_space',
      success: true,
      documentId: document.id
    }
  } catch (error) {
    console.error("Erreur sauvegarde espace locataire:", error)
    return {
      type: 'tenant_space',
      success: false,
      error: error.message
    }
  }
}

async function createDocumentNotification(data: {
  leaseId: string
  propertyId: string
  tenantId: string
  documentType: 'amendment' | 'statement'
  documentUrl: string
  documentFilename: string
}) {
  try {
    const title = data.documentType === 'amendment' 
      ? 'Nouvel avenant de bail reçu' 
      : 'Nouveau décompte de charges reçu'

    const message = data.documentType === 'amendment'
      ? 'Un nouvel avenant de bail concernant la révision de votre loyer a été envoyé. Vous pouvez le consulter dans votre espace locataire.'
      : 'Un nouveau décompte de charges locatives a été envoyé. Vous pouvez le consulter dans votre espace locataire.'

    const { data: notification, error } = await supabase
      .from('revision_notifications')
      .insert({
        lease_id: data.leaseId,
        property_id: data.propertyId,
        notification_type: 'document_sent',
        title,
        message,
        recipient_type: 'tenant',
        recipient_id: data.tenantId,
        metadata: {
          document_type: data.documentType,
          document_url: data.documentUrl,
          document_filename: data.documentFilename
        },
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création notification:", error)
      return {
        type: 'notification',
        success: false,
        error: error.message
      }
    }

    return {
      type: 'notification',
      success: true,
      notificationId: notification.id
    }
  } catch (error) {
    console.error("Erreur création notification:", error)
    return {
      type: 'notification',
      success: false,
      error: error.message
    }
  }
}

async function updateDocumentStatus(leaseId: string, documentType: 'amendment' | 'statement', status: string) {
  try {
    const table = documentType === 'amendment' ? 'lease_revisions' : 'charge_regularizations'
    const statusField = documentType === 'amendment' ? 'status' : 'status'
    const sentField = documentType === 'amendment' ? 'sent_to_tenant_date' : 'sent_to_tenant_date'

    const { error } = await supabase
      .from(table)
      .update({
        [statusField]: status,
        [sentField]: new Date().toISOString()
      })
      .eq('lease_id', leaseId)
      .eq('revision_year', new Date().getFullYear())

    if (error) {
      console.error("Erreur mise à jour statut document:", error)
    }
  } catch (error) {
    console.error("Erreur mise à jour statut document:", error)
  }
}
