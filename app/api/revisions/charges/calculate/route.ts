import { NextRequest, NextResponse } from "next/server"
import { supabase, createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur depuis les headers ou le token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { leaseId, year, provisionsPeriodStart, provisionsPeriodEnd } = body

    const supabaseAdmin = createServerClient()

    // Récupérer les données du bail avec le client admin
    const { data: lease, error: leaseError } = await supabaseAdmin
      .from('leases')
      .select(`
        id,
        property_id,
        montant_provisions_charges,
        property:properties(
          id,
          owner_id,
          title,
          address
        )
      `)
      .eq('id', leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    if (lease.property.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Calculer les provisions encaissées via les quittances
    const { data: receipts, error: receiptsError } = await supabaseAdmin
      .from('rent_receipts')
      .select('charges_amount, payment_date, rent_amount')
      .eq('lease_id', leaseId)
      .gte('payment_date', provisionsPeriodStart)
      .lte('payment_date', provisionsPeriodEnd)
      .eq('status', 'paid')
      .order('payment_date', { ascending: true })

    if (receiptsError) {
      console.error("Erreur récupération quittances:", receiptsError)
      return NextResponse.json({ error: "Erreur lors du calcul" }, { status: 500 })
    }

    // Calculer les provisions encaissées depuis les quittances
    const totalProvisionsCollected = receipts.reduce((sum, receipt) => {
      return sum + (receipt.charges_amount || 0)
    }, 0)

    // Calculer le nombre de quittances et la moyenne mensuelle
    const receiptCount = receipts.length
    const averageMonthlyProvision = receiptCount > 0 ? totalProvisionsCollected / receiptCount : 0

    // Calculer la période en jours pour un calcul plus précis
    const startDate = new Date(provisionsPeriodStart)
    const endDate = new Date(provisionsPeriodEnd)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const monthsDiff = daysDiff / 30.44 // Moyenne de jours par mois

    // Récupérer les paramètres de charges du bail
    const { data: chargeSettings, error: settingsError } = await supabaseAdmin
      .from('lease_charge_settings')
      .select('*')
      .eq('lease_id', leaseId)
      .single()

    // Si pas de paramètres, créer des paramètres par défaut
    let defaultChargeCategories = [
      { name: 'Eau', category: 'eau', recoverable: true },
      { name: 'Chauffage', category: 'chauffage', recoverable: true },
      { name: 'Ascenseur', category: 'ascenseur', recoverable: true },
      { name: 'Électricité parties communes', category: 'electricite', recoverable: true },
      { name: 'TEOM', category: 'teom', recoverable: true },
      { name: 'Gardiennage', category: 'gardiennage', recoverable: true },
      { name: 'Nettoyage', category: 'nettoyage', recoverable: true }
    ]

    const chargeCategories = chargeSettings?.charge_categories || defaultChargeCategories

    // Calculer le nombre de mois de provisions

    return NextResponse.json({
      success: true,
      calculation: {
        totalProvisionsCollected,
        receiptCount,
        averageMonthlyProvision,
        daysDiff,
        monthsDiff,
        chargeCategories,
        receipts: receipts.map(receipt => ({
          date: receipt.payment_date,
          chargesAmount: receipt.charges_amount,
          rentAmount: receipt.rent_amount
        })),
        lease: {
          id: lease.id,
          property: lease.property,
          monthlyProvisionAmount: lease.montant_provisions_charges
        }
      }
    })
  } catch (error) {
    console.error("Erreur calcul régularisation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
