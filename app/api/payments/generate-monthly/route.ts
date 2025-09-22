import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'

// POST /api/payments/generate-monthly - Générer les paiements mensuels
export async function POST(request: NextRequest) {
  try {
    const payments = await paymentService.generateMonthlyPayments()
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Erreur POST /api/payments/generate-monthly:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
