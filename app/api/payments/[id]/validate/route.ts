import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'

// POST /api/payments/[id]/validate - Valider un paiement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id
    const body = await request.json()
    
    const result = await paymentService.validatePayment({
      payment_id: paymentId,
      status: body.status,
      payment_date: body.payment_date,
      payment_method: body.payment_method,
      notes: body.notes
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur POST /api/payments/[id]/validate:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
