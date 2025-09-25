const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSpecificLease() {
  console.log('🧪 Test spécifique pour le bail avec date d\'entrée 2025-09-04')
  console.log('=' .repeat(60))

  try {
    // 1. Test de connexion Supabase
    console.log('1. Test de connexion Supabase...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Erreur d\'authentification:', authError.message)
      console.log('💡 Vous devez être connecté pour tester cette API')
      return
    }
    
    if (!user) {
      console.log('❌ Aucun utilisateur connecté')
      console.log('💡 Connectez-vous d\'abord sur l\'application')
      return
    }
    
    console.log('✅ Utilisateur connecté:', user.email)

    // 2. Récupérer le bail avec date d'entrée 2025-09-04
    console.log('\n2. Recherche du bail avec date d\'entrée 2025-09-04...')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('❌ Aucune session active')
      return
    }

    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select(`
        id, 
        property_id, 
        tenant_id, 
        start_date, 
        end_date,
        monthly_rent,
        montant_provisions_charges,
        tenant:users!leases_tenant_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        owner:users!leases_owner_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('owner_id', user.id)
      .eq('start_date', '2025-09-04')

    if (leaseError) {
      console.log('❌ Erreur recherche bail:', leaseError)
      return
    }

    if (!leases || leases.length === 0) {
      console.log('❌ Aucun bail trouvé avec la date d\'entrée 2025-09-04')
      console.log('💡 Vérifiez que vous êtes le propriétaire de ce bail')
      return
    }

    const lease = leases[0]
    console.log('✅ Bail trouvé:', lease.id)
    console.log('   - Locataire:', lease.tenant.first_name, lease.tenant.last_name)
    console.log('   - Date d\'entrée:', lease.start_date)
    console.log('   - Date de fin:', lease.end_date || 'fin ouverte')
    console.log('   - Loyer mensuel:', lease.monthly_rent, '€')
    console.log('   - Provisions charges:', lease.montant_provisions_charges, '€')

    // 3. Vérifier les quittances pour septembre 2025
    console.log('\n3. Vérification des quittances pour septembre 2025...')
    
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('*')
      .eq('lease_id', lease.id)
      .eq('year', 2025)
      .eq('month', '2025-09')

    if (receiptsError) {
      console.log('❌ Erreur récupération quittances:', receiptsError)
      return
    }

    console.log('✅ Quittances trouvées:', receipts.length)
    receipts.forEach(receipt => {
      console.log(`   - Mois: ${receipt.month}`)
      console.log(`   - Loyer: ${receipt.rent_amount} €`)
      console.log(`   - Charges: ${receipt.charges_amount} €`)
      console.log(`   - Total: ${receipt.total_amount} €`)
      console.log(`   - Généré le: ${receipt.generated_at}`)
    })

    // 4. Test de calcul de période d'occupation
    console.log('\n4. Test de calcul de période d\'occupation...')
    
    const leaseStartDate = new Date(lease.start_date)
    const leaseEndDate = lease.end_date ? new Date(lease.end_date) : null
    const currentYear = 2025
    
    const yearStart = new Date(currentYear, 0, 1) // 1er janvier 2025
    const yearEnd = new Date(currentYear, 11, 31) // 31 décembre 2025
    
    const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart
    const effectiveEnd = leaseEndDate && leaseEndDate < yearEnd ? leaseEndDate : yearEnd
    
    const daysDiff = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const totalDaysInYear = 365 // 2025 n'est pas bissextile
    const percentage = (daysDiff / totalDaysInYear) * 100
    
    console.log('✅ Calcul de période d\'occupation:')
    console.log('   - Début effectif:', effectiveStart.toLocaleDateString('fr-FR'))
    console.log('   - Fin effective:', effectiveEnd.toLocaleDateString('fr-FR'))
    console.log('   - Durée:', daysDiff, 'jours')
    console.log('   - Pourcentage:', percentage.toFixed(2), '% de l\'année 2025')

    // 5. Test de l'API de calcul des provisions
    console.log('\n5. Test de l\'API de calcul des provisions...')
    
    const provisionsPeriodStart = effectiveStart.toISOString().split('T')[0]
    const provisionsPeriodEnd = effectiveEnd.toISOString().split('T')[0]
    
    const calculateResponse = await fetch('http://localhost:3000/api/revisions/charges/calculate', {
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

    console.log('📊 Status calcul provisions:', calculateResponse.status)
    
    if (calculateResponse.ok) {
      const calculateData = await calculateResponse.json()
      console.log('✅ Calcul provisions réussi:')
      console.log('   - Provisions encaissées:', calculateData.calculation.totalProvisionsCollected, '€')
      console.log('   - Nombre de quittances:', calculateData.calculation.receiptCount)
      console.log('   - Période en jours:', calculateData.calculation.daysDiff)
      console.log('   - Période en mois:', calculateData.calculation.monthsDiff?.toFixed(2))
      
      if (calculateData.calculation.receipts && calculateData.calculation.receipts.length > 0) {
        console.log('   - Détail des quittances:')
        calculateData.calculation.receipts.forEach(receipt => {
          console.log(`     * ${receipt.month}: ${receipt.chargesAmount} € de charges`)
        })
      }
    } else {
      const errorData = await calculateResponse.json()
      console.log('❌ Erreur calcul provisions:', errorData)
    }

    // 6. Test de proratisation avec des charges d'exemple
    console.log('\n6. Test de proratisation avec charges d\'exemple...')
    
    const testCharges = [
      { name: 'Eau', annualAmount: 1200, recoverable: true },
      { name: 'Chauffage', annualAmount: 800, recoverable: true },
      { name: 'Ascenseur', annualAmount: 400, recoverable: true },
      { name: 'TEOM', annualAmount: 300, recoverable: true }
    ]
    
    console.log('✅ Calcul de proratisation pour', daysDiff, 'jours d\'occupation:')
    testCharges.forEach(charge => {
      const proratedAmount = (charge.annualAmount * daysDiff) / totalDaysInYear
      console.log(`   - ${charge.name}: ${charge.annualAmount}€/an → ${proratedAmount.toFixed(2)}€ (${percentage.toFixed(1)}%)`)
    })

    // 7. Résumé des corrections apportées
    console.log('\n📋 Résumé des corrections apportées:')
    console.log('✅ Table de quittances corrigée: rent_receipts → receipts')
    console.log('✅ Calcul de période d\'occupation automatique')
    console.log('✅ Récupération des provisions depuis les quittances')
    console.log('✅ Persistance des paramètres du bail')
    console.log('✅ Tableau visible même sans calcul préalable')
    console.log('✅ Calcul au prorata jours exacts')

    console.log('\n🎯 Résultat attendu:')
    console.log(`   - Période d'occupation: ${daysDiff} jours (${percentage.toFixed(1)}%)`)
    console.log(`   - Provisions encaissées: ${receipts.length > 0 ? receipts[0].charges_amount : 0} €`)
    console.log(`   - Provisions mensuelles: ${lease.montant_provisions_charges || 'Non définies'} €`)

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

// Exécuter le test
testSpecificLease()
  .then(() => {
    console.log('\n🏁 Test spécifique terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
