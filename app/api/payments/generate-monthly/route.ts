import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/payments/generate-monthly - Générer les paiements mensuels
export async function POST(request: NextRequest) {
  try {
    const server = createServerClient()
    
    // Vérifier l'authentification
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Générer le mois actuel au format "2025-03"
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Utiliser la fonction SQL pour générer les paiements
    const { data: payments, error } = await server
      .rpc('generate_monthly_payments', { target_month: currentMonth })

    if (error) {
      console.error('Erreur génération paiements:', error)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json(payments || [])
  } catch (error) {
    console.error('Erreur POST /api/payments/generate-monthly:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
