import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'

// POST /api/payments/[id]/reminder - Envoyer un rappel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id
    const body = await request.json()
    
    const result = await paymentService.sendReminder({
      payment_id: paymentId,
      reminder_type: body.reminder_type,
      custom_message: body.custom_message
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur POST /api/payments/[id]/reminder:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
