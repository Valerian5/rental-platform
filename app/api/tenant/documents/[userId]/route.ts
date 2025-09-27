import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 })
    }

    const supabaseAdmin = createServerClient()

    // Récupérer les notifications de documents pour cet utilisateur
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .in('type', ['charge_regularization', 'rent_revision'])
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('Erreur récupération notifications:', notificationsError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    // Transformer les notifications en documents
    const documents = notifications.map(notification => {
      const data = notification.data || {}
      
      let title = ''
      let description = ''
      let type: 'charge_regularization' | 'rent_revision' | 'lease' | 'other' = 'other'

      if (notification.type === 'charge_regularization') {
        title = `Régularisation des charges ${data.year || ''}`
        description = data.balance_type === 'refund' 
          ? `Remboursement de ${Math.abs(data.balance || 0).toFixed(2)} €`
          : `Complément de ${Math.abs(data.balance || 0).toFixed(2)} € à payer`
        type = 'charge_regularization'
      } else if (notification.type === 'rent_revision') {
        title = `Révision de loyer ${data.year || ''}`
        description = data.increase > 0 
          ? `Augmentation de ${data.increase?.toFixed(2)} € (${data.increase_percentage?.toFixed(2)}%)`
          : `Diminution de ${Math.abs(data.increase || 0).toFixed(2)} € (${data.increase_percentage?.toFixed(2)}%)`
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
        pdf_url: data.pdf_url,
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
