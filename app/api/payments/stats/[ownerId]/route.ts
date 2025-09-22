import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'

// GET /api/payments/stats/[ownerId] - Récupérer les statistiques des paiements
export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    const stats = await paymentService.getPaymentStats(params.ownerId, period)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur GET /api/payments/stats/[ownerId]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
