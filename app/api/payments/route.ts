import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'

// GET /api/payments - Récupérer tous les paiements d'un propriétaire
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')
    
    if (!ownerId) {
      return NextResponse.json({ error: 'Owner ID requis' }, { status: 400 })
    }

    const payments = await paymentService.getOwnerPayments(ownerId)
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Erreur GET /api/payments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/payments - Créer un nouveau paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Implémenter la création de paiement
    // const payment = await paymentService.createPayment(body)
    
    return NextResponse.json({ message: 'Paiement créé' })
  } catch (error) {
    console.error('Erreur POST /api/payments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
