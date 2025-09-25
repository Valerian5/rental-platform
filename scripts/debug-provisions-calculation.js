const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProvisionsCalculation() {
  console.log('🔍 Debug du calcul des provisions')
  console.log('=' .repeat(50))

  try {
    // 1. Test de connexion Supabase
    console.log('1. Test de connexion Supabase...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Aucun utilisateur connecté')
      return
    }
    
    console.log('✅ Utilisateur connecté:', user.email)

    // 2. Récupérer un bail existant
    console.log('\n2. Récupération d\'un bail existant...')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('❌ Aucune session active')
      return
    }

    // Récupérer les propriétés de l'utilisateur
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('owner_id', user.id)
      .limit(1)

    if (propError || !properties || properties.length === 0) {
      console.log('❌ Aucune propriété trouvée')
      return
    }

    const property = properties[0]
    console.log('✅ Propriété trouvée:', property.title)

    // Récupérer un bail pour cette propriété
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select(`
        id, 
        property_id, 
        start_date, 
        end_date,
        monthly_rent,
        montant_provisions_charges
      `)
      .eq('property_id', property.id)
      .limit(1)

    if (leaseError || !leases || leases.length === 0) {
      console.log('❌ Aucun bail trouvé')
      return
    }

    const lease = leases[0]
    console.log('✅ Bail trouvé:', lease.id)
    console.log('   - Date début:', lease.start_date)
    console.log('   - Date fin:', lease.end_date || 'fin ouverte')
    console.log('   - Provisions charges:', lease.montant_provisions_charges)

    // 3. Vérifier les quittances pour ce bail
    console.log('\n3. Vérification des quittances...')
    const { data: receipts, error: receiptsError } = await supabase
      .from('rent_receipts')
      .select('*')
      .eq('lease_id', lease.id)
      .order('payment_date', { ascending: true })

    if (receiptsError) {
      console.log('❌ Erreur récupération quittances:', receiptsError)
      return
    }

    console.log(`✅ ${receipts.length} quittances trouvées:`)
    receipts.forEach((receipt, index) => {
      console.log(`   ${index + 1}. Date: ${receipt.payment_date}, Loyer: ${receipt.rent_amount}€, Charges: ${receipt.charges_amount}€, Total: ${receipt.total_amount}€, Statut: ${receipt.status}`)
    })

    // 4. Calculer la période d'occupation pour 2025
    console.log('\n4. Calcul de la période d\'occupation pour 2025...')
    const leaseStartDate = new Date(lease.start_date)
    const leaseEndDate = lease.end_date ? new Date(lease.end_date) : null
    const currentYear = 2025
    
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31)
    
    const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart
    const effectiveEnd = leaseEndDate && leaseEndDate < yearEnd ? leaseEndDate : yearEnd
    
    const daysDiff = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    console.log('✅ Période d\'occupation calculée:')
    console.log('   - Début effectif:', effectiveStart.toLocaleDateString('fr-FR'))
    console.log('   - Fin effective:', effectiveEnd.toLocaleDateString('fr-FR'))
    console.log('   - Durée:', daysDiff, 'jours')

    // 5. Filtrer les quittances pour la période
    console.log('\n5. Filtrage des quittances pour la période...')
    const provisionsPeriodStart = effectiveStart.toISOString().split('T')[0]
    const provisionsPeriodEnd = effectiveEnd.toISOString().split('T')[0]
    
    console.log('   - Période de provisions:', provisionsPeriodStart, '→', provisionsPeriodEnd)
    
    const filteredReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.payment_date)
      return receiptDate >= effectiveStart && receiptDate <= effectiveEnd && receipt.status === 'paid'
    })
    
    console.log(`✅ ${filteredReceipts.length} quittances dans la période:`)
    filteredReceipts.forEach((receipt, index) => {
      console.log(`   ${index + 1}. Date: ${receipt.payment_date}, Charges: ${receipt.charges_amount}€`)
    })

    // 6. Calculer le total des provisions
    const totalProvisionsCollected = filteredReceipts.reduce((sum, receipt) => {
      return sum + (receipt.charges_amount || 0)
    }, 0)
    
    console.log('\n6. Calcul du total des provisions:')
    console.log('✅ Total provisions encaissées:', totalProvisionsCollected, '€')

    // 7. Test de l'API
    console.log('\n7. Test de l\'API de calcul...')
    const response = await fetch('http://localhost:3000/api/revisions/charges/calculate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        leaseId: lease.id,
        year: currentYear,
        provisionsPeriodStart,
        provisionsPeriodEnd
      })
    })

    console.log('📊 Status API:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Réponse API:', data)
    } else {
      const errorData = await response.json()
      console.log('❌ Erreur API:', errorData)
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message)
  }
}

// Exécuter le debug
debugProvisionsCalculation()
  .then(() => {
    console.log('\n🏁 Debug terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
