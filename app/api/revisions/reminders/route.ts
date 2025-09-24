import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'check-reminders') {
      return await checkAndSendReminders(user.id)
    } else if (action === 'create-reminder') {
      return await createReminder(body)
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
  } catch (error) {
    console.error("Erreur API rappels:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function checkAndSendReminders(userId: string) {
  try {
    const today = new Date()
    const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // Récupérer les baux avec des dates de révision proches
    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select(`
        id,
        property_id,
        tenant_id,
        date_revision_loyer,
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
      .eq('status', 'active')
      .eq('property.owner_id', userId)

    if (leasesError) {
      console.error("Erreur récupération baux:", leasesError)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    const reminders = []

    for (const lease of leases || []) {
      if (!lease.date_revision_loyer) continue

      const revisionDate = new Date(lease.date_revision_loyer)
      const currentYear = today.getFullYear()
      
      // Ajuster la date de révision pour l'année courante
      revisionDate.setFullYear(currentYear)
      
      // Si la date est passée cette année, prendre l'année suivante
      if (revisionDate < today) {
        revisionDate.setFullYear(currentYear + 1)
      }

      const daysUntilRevision = Math.ceil((revisionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Vérifier si on est dans la période de rappel (30 jours avant)
      if (daysUntilRevision <= 30 && daysUntilRevision > 0) {
        // Vérifier si une révision existe déjà pour cette année
        const { data: existingRevision } = await supabase
          .from('lease_revisions')
          .select('id')
          .eq('lease_id', lease.id)
          .eq('revision_year', revisionDate.getFullYear())
          .single()

        if (!existingRevision) {
          // Vérifier si un rappel a déjà été envoyé
          const { data: existingReminder } = await supabase
            .from('revision_notifications')
            .select('id')
            .eq('lease_id', lease.id)
            .eq('notification_type', 'rent_revision_reminder')
            .eq('recipient_id', userId)
            .gte('created_at', new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Dans les 7 derniers jours
            .single()

          if (!existingReminder) {
            // Créer le rappel
            const reminder = await createReminderNotification({
              leaseId: lease.id,
              propertyId: lease.property_id,
              recipientId: userId,
              recipientType: 'owner',
              daysUntilRevision,
              revisionDate: revisionDate.toISOString().split('T')[0],
              lease: lease
            })

            if (reminder) {
              reminders.push(reminder)
            }
          }
        }
      }

      // Vérifier les rappels de régularisation des charges (1 an après le début du bail)
      const leaseStartDate = new Date(lease.created_at)
      const oneYearAfterStart = new Date(leaseStartDate.getTime() + 365 * 24 * 60 * 60 * 1000)
      const daysUntilChargeRegularization = Math.ceil((oneYearAfterStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilChargeRegularization <= 30 && daysUntilChargeRegularization > 0) {
        // Vérifier si une régularisation existe déjà pour cette année
        const { data: existingRegularization } = await supabase
          .from('charge_regularizations')
          .select('id')
          .eq('lease_id', lease.id)
          .eq('regularization_year', oneYearAfterStart.getFullYear())
          .single()

        if (!existingRegularization) {
          // Vérifier si un rappel a déjà été envoyé
          const { data: existingReminder } = await supabase
            .from('revision_notifications')
            .select('id')
            .eq('lease_id', lease.id)
            .eq('notification_type', 'charge_regularization_reminder')
            .eq('recipient_id', userId)
            .gte('created_at', new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .single()

          if (!existingReminder) {
            // Créer le rappel
            const reminder = await createChargeRegularizationReminder({
              leaseId: lease.id,
              propertyId: lease.property_id,
              recipientId: userId,
              recipientType: 'owner',
              daysUntilRegularization: daysUntilChargeRegularization,
              regularizationDate: oneYearAfterStart.toISOString().split('T')[0],
              lease: lease
            })

            if (reminder) {
              reminders.push(reminder)
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      remindersCreated: reminders.length,
      reminders 
    })
  } catch (error) {
    console.error("Erreur vérification rappels:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function createReminderNotification(data: {
  leaseId: string
  propertyId: string
  recipientId: string
  recipientType: string
  daysUntilRevision: number
  revisionDate: string
  lease: any
}) {
  try {
    const title = `Rappel : Révision de loyer dans ${data.daysUntilRevision} jour${data.daysUntilRevision > 1 ? 's' : ''}`
    const message = `La révision annuelle du loyer pour le logement "${data.lease.property.title}" est prévue le ${new Date(data.revisionDate).toLocaleDateString('fr-FR')}. N'oubliez pas de procéder à la révision selon l'indice IRL.`

    const { data: notification, error } = await supabase
      .from('revision_notifications')
      .insert({
        lease_id: data.leaseId,
        property_id: data.propertyId,
        notification_type: 'rent_revision_reminder',
        title,
        message,
        recipient_type: data.recipientType,
        recipient_id: data.recipientId,
        metadata: {
          days_until_revision: data.daysUntilRevision,
          revision_date: data.revisionDate,
          lease_title: data.lease.property.title
        },
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création rappel révision:", error)
      return null
    }

    return notification
  } catch (error) {
    console.error("Erreur création rappel révision:", error)
    return null
  }
}

async function createChargeRegularizationReminder(data: {
  leaseId: string
  propertyId: string
  recipientId: string
  recipientType: string
  daysUntilRegularization: number
  regularizationDate: string
  lease: any
}) {
  try {
    const title = `Rappel : Régularisation des charges dans ${data.daysUntilRegularization} jour${data.daysUntilRegularization > 1 ? 's' : ''}`
    const message = `La régularisation annuelle des charges pour le logement "${data.lease.property.title}" est prévue le ${new Date(data.regularizationDate).toLocaleDateString('fr-FR')}. N'oubliez pas de procéder à la régularisation des charges locatives.`

    const { data: notification, error } = await supabase
      .from('revision_notifications')
      .insert({
        lease_id: data.leaseId,
        property_id: data.propertyId,
        notification_type: 'charge_regularization_reminder',
        title,
        message,
        recipient_type: data.recipientType,
        recipient_id: data.recipientId,
        metadata: {
          days_until_regularization: data.daysUntilRegularization,
          regularization_date: data.regularizationDate,
          lease_title: data.lease.property.title
        },
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création rappel régularisation:", error)
      return null
    }

    return notification
  } catch (error) {
    console.error("Erreur création rappel régularisation:", error)
    return null
  }
}

async function createReminder(body: any) {
  // Fonction pour créer manuellement un rappel
  // À implémenter selon les besoins
  return NextResponse.json({ error: "Non implémenté" }, { status: 501 })
}
