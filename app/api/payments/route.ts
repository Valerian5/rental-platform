import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/payments - Récupérer tous les paiements d'un propriétaire
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')
    
    if (!ownerId) {
      return NextResponse.json({ error: 'Owner ID requis' }, { status: 400 })
    }

    // Vérifier l'authentification
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les paiements du propriétaire via les baux
    const { data: payments, error } = await server
      .from('payments')
      .select(`
        *,
        leases!inner(
          id,
          bailleur_id,
          property:properties(
            id,
            title,
            address
          ),
          tenant:users(
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('leases.bailleur_id', ownerId)
      .order('due_date', { ascending: false })

    if (error) {
      console.error('Erreur récupération paiements:', error)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json(payments || [])
  } catch (error) {
    console.error('Erreur GET /api/payments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/payments - Créer un nouveau paiement
export async function POST(request: NextRequest) {
  try {
    const server = createServerClient()
    const body = await request.json()
    
    // Vérifier l'authentification
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Créer le paiement
    const { data: payment, error } = await server
      .from('payments')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Erreur création paiement:', error)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }
    
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Erreur POST /api/payments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
