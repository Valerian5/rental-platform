import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/payments/stats/[ownerId] - Récupérer les statistiques des paiements
export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    const server = createServerClient()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    // Vérifier l'authentification
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Calculer les dates selon la période
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0) // Toutes les périodes
    }

    // Récupérer les paiements du propriétaire
    const { data: payments, error } = await server
      .from('payments')
      .select(`
        amount_due,
        status,
        payment_date,
        due_date,
        leases!inner(bailleur_id)
      `)
      .eq('leases.bailleur_id', params.ownerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) {
      console.error('Erreur récupération statistiques:', error)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    // Calculer les statistiques
    const totalReceived = payments
      ?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount_due), 0) || 0

    const totalPending = payments
      ?.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount_due), 0) || 0

    const totalOverdue = payments
      ?.filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount_due), 0) || 0

    const totalAmount = totalReceived + totalPending + totalOverdue
    const collectionRate = totalAmount > 0 ? (totalReceived / totalAmount) * 100 : 0

    // Calculer le délai moyen de paiement
    const paidPayments = payments?.filter(p => p.status === 'paid' && p.payment_date) || []
    const averageDelay = paidPayments.length > 0 
      ? paidPayments.reduce((sum, payment) => {
          const dueDate = new Date(payment.due_date)
          const paidDate = new Date(payment.payment_date)
          const delay = Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          return sum + delay
        }, 0) / paidPayments.length
      : 0

    const stats = {
      total_received: totalReceived,
      total_pending: totalPending,
      total_overdue: totalOverdue,
      collection_rate: Math.round(collectionRate * 100) / 100,
      average_delay: Math.round(averageDelay)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur GET /api/payments/stats/[ownerId]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
