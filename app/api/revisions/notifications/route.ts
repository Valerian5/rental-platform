import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const leaseId = searchParams.get('leaseId')
    const notificationType = searchParams.get('type')

    let query = supabase
      .from('revision_notifications')
      .select(`
        *,
        lease:leases(
          id,
          property:properties(
            id,
            title,
            address
          )
        )
      `)
      .or(`recipient_id.eq.${user.id},property_id.in.(${await getUserPropertyIds(user.id)})`)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (leaseId) {
      query = query.eq('lease_id', leaseId)
    }

    if (notificationType) {
      query = query.eq('notification_type', notificationType)
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Erreur récupération notifications:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error("Erreur API notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      leaseId, 
      propertyId,
      notificationType,
      title,
      message,
      recipientType,
      recipientId,
      recipientEmail,
      metadata
    } = body

    // Vérifier que l'utilisateur est propriétaire de la propriété
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { data: notification, error } = await supabase
      .from('revision_notifications')
      .insert({
        lease_id: leaseId,
        property_id: propertyId,
        notification_type: notificationType,
        title,
        message,
        recipient_type: recipientType,
        recipient_id: recipientId,
        recipient_email: recipientEmail,
        metadata: metadata || {},
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création notification:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    // Envoyer la notification par email si nécessaire
    if (recipientEmail && notificationType !== 'system') {
      await sendNotificationEmail(notification)
    }

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("Erreur API création notification:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function getUserPropertyIds(userId: string): Promise<string> {
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId)
  
  return properties?.map(p => p.id).join(',') || ''
}

async function sendNotificationEmail(notification: any): Promise<void> {
  try {
    // Ici, vous implémenteriez l'envoi d'email réel
    // Pour l'instant, on simule
    console.log(`Envoi email à ${notification.recipient_email}: ${notification.title}`)
    
    // Mettre à jour le statut de la notification
    await supabase
      .from('revision_notifications')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notification.id)
  } catch (error) {
    console.error("Erreur envoi email:", error)
    
    // Marquer comme échec
    await supabase
      .from('revision_notifications')
      .update({ status: 'failed' })
      .eq('id', notification.id)
  }
}
