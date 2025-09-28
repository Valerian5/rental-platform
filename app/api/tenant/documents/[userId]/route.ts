import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    console.log('🔍 API Documents Tenant - User ID:', userId)

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 })
    }

    const supabaseAdmin = createServerClient()

    // Récupérer les notifications de documents pour cet utilisateur
    console.log('🔍 API Documents Tenant - Récupération des notifications...')
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .in('type', ['charge_regularization', 'rent_revision'])
      .order('created_at', { ascending: false })

    console.log('🔍 API Documents Tenant - Notifications trouvées:', notifications?.length || 0)
    console.log('🔍 API Documents Tenant - Erreur notifications:', notificationsError)

    if (notificationsError) {
      console.error('Erreur récupération notifications:', notificationsError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    // Transformer les notifications en documents
    const documents = notifications.map(notification => {
      // Extraire les données de l'action_url ou du content
      let data = {}
      try {
        if (notification.action_url) {
          // Si action_url contient des données JSON
          const url = new URL(notification.action_url)
          const dataParam = url.searchParams.get('data')
          if (dataParam) {
            data = JSON.parse(decodeURIComponent(dataParam))
          }
        }
      } catch (error) {
        console.log('Erreur parsing action_url:', error)
      }
      
      let title = notification.title
      let description = notification.content
      let type: 'charge_regularization' | 'rent_revision' | 'lease' | 'other' = 'other'

      if (notification.type === 'charge_regularization') {
        type = 'charge_regularization'
      } else if (notification.type === 'rent_revision') {
        type = 'rent_revision'
      }

      return {
        id: notification.id,
        type,
        title,
        description,
        year: data.year,
        amount: data.balance,
        balance_type: data.balance_type,
        old_rent: data.old_rent,
        new_rent: data.new_rent,
        increase: data.increase,
        increase_percentage: data.increase_percentage,
        pdf_url: data.pdf_url || notification.action_url,
        created_at: notification.created_at,
        data: data
      }
    })

    return NextResponse.json({ 
      success: true,
      documents 
    })

  } catch (error) {
    console.error('Erreur récupération documents:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
