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
    const { leaseId, year: requestYear, provisionsPeriodStart, provisionsPeriodEnd } = body

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
    const year = parseInt(provisionsPeriodStart.split('-')[0])
    const startMonth = provisionsPeriodStart.split('-')[1]
    const endMonth = provisionsPeriodEnd.split('-')[1]
    
    console.log('🔍 Recherche quittances pour:', {
      leaseId,
      year: requestYear,
      startMonth,
      endMonth,
      provisionsPeriodStart,
      provisionsPeriodEnd
    })
    
    // D'abord, vérifier toutes les quittances pour ce bail
    const { data: allReceipts, error: allReceiptsError } = await supabaseAdmin
      .from('receipts')
      .select('charges_amount, month, year, rent_amount, generated_at')
      .eq('lease_id', leaseId)
      .order('year', { ascending: true })
      .order('month', { ascending: true })
    
    console.log('📋 Toutes les quittances pour ce bail:', allReceipts)
    
    // Maintenant filtrer par année (s'assurer que year est un integer)
    const yearInt = parseInt(year.toString())
    console.log('📊 Conversion année:', year, '→', yearInt)
    
    const { data: receipts, error: receiptsError } = await supabaseAdmin
      .from('receipts')
      .select('charges_amount, month, year, rent_amount, generated_at')
      .eq('lease_id', leaseId)
      .eq('year', yearInt)
      .order('month', { ascending: true })

    if (receiptsError) {
      console.error("Erreur récupération quittances:", receiptsError)
      return NextResponse.json({ error: "Erreur lors du calcul" }, { status: 500 })
    }

    console.log('📊 Quittances trouvées:', receipts.length)
    console.log('📊 Année recherchée:', year, 'Type:', typeof year)
    receipts.forEach(receipt => {
      console.log(`   - ${receipt.month}: ${receipt.charges_amount} € de charges (année: ${receipt.year})`)
    })

    // Calculer les provisions encaissées depuis les quittances
    // MAIS seulement pour la période effective d'occupation
    const startDate = new Date(provisionsPeriodStart)
    const endDate = new Date(provisionsPeriodEnd)
    
    const totalProvisionsCollected = receipts.reduce((sum, receipt) => {
      // Utiliser la même logique que la page fiscale pour parser le mois
      let monthNumber: number

      if (typeof receipt.month === "string") {
        const parts = receipt.month.split("-") // ex: "2025-09"
        monthNumber = parts.length === 2 ? parseInt(parts[1], 10) : parseInt(receipt.month, 10)
      } else {
        monthNumber = receipt.month
      }

      if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        console.warn(`Mois invalide trouvé pour receipt ${receipt.id}:`, receipt.month)
        monthNumber = 1 // Valeur par défaut
      }

      // Créer la date de la quittance (1er du mois)
      const receiptDate = new Date(`${receipt.year}-${monthNumber.toString().padStart(2, '0')}-01`)
      
      console.log(`📅 Vérification quittance ${receipt.month}:`, {
        monthNumber,
        receiptDate: receiptDate.toISOString().split('T')[0],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        inRange: receiptDate >= startDate && receiptDate <= endDate,
        chargesAmount: receipt.charges_amount
      })
      
      if (receiptDate >= startDate && receiptDate <= endDate) {
        console.log(`✅ Quittance incluse: ${receipt.month} = ${receipt.charges_amount} €`)
        return sum + (receipt.charges_amount || 0)
      } else {
        console.log(`❌ Quittance exclue: ${receipt.month} (hors période)`)
      }
      return sum
    }, 0)
    
    console.log('💰 Total provisions calculé pour la période effective:', totalProvisionsCollected, '€')
    console.log('📅 Période effective:', provisionsPeriodStart, '→', provisionsPeriodEnd)
    console.log('📅 Dates de calcul:')
    console.log('   - startDate:', startDate.toISOString().split('T')[0])
    console.log('   - endDate:', endDate.toISOString().split('T')[0])
    console.log('   - startDate type:', typeof startDate, startDate)
    console.log('   - endDate type:', typeof endDate, endDate)

    // Calculer le nombre de quittances et la moyenne mensuelle
    const receiptCount = receipts.length
    const averageMonthlyProvision = receiptCount > 0 ? totalProvisionsCollected / receiptCount : 0

    // Calculer la période en jours pour un calcul plus précis
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
          month: receipt.month,
          year: receipt.year,
          chargesAmount: receipt.charges_amount,
          rentAmount: receipt.rent_amount,
          generatedAt: receipt.generated_at
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
