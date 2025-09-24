import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { leaseId, year, provisionsPeriodStart, provisionsPeriodEnd } = body

    // Récupérer les données du bail
    const { data: lease, error: leaseError } = await supabase
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
    const { data: receipts, error: receiptsError } = await supabase
      .from('rent_receipts')
      .select('charges_amount, payment_date')
      .eq('lease_id', leaseId)
      .gte('payment_date', provisionsPeriodStart)
      .lte('payment_date', provisionsPeriodEnd)
      .eq('status', 'paid')

    if (receiptsError) {
      console.error("Erreur récupération quittances:", receiptsError)
      return NextResponse.json({ error: "Erreur lors du calcul" }, { status: 500 })
    }

    // Calculer le total des provisions encaissées
    const totalProvisionsCollected = receipts.reduce((sum, receipt) => {
      return sum + (receipt.charges_amount || 0)
    }, 0)

    // Récupérer les paramètres de charges du bail
    const { data: chargeSettings, error: settingsError } = await supabase
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
    const startDate = new Date(provisionsPeriodStart)
    const endDate = new Date(provisionsPeriodEnd)
    const monthsCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

    // Calculer la provision mensuelle moyenne
    const averageMonthlyProvision = monthsCount > 0 ? totalProvisionsCollected / monthsCount : 0

    return NextResponse.json({
      success: true,
      calculation: {
        totalProvisionsCollected,
        monthsCount,
        averageMonthlyProvision,
        chargeCategories,
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
