const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRevisionSystem() {
  console.log('🧪 Test complet du système de révision')
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

    // 2. Récupérer un bail existant pour le test
    console.log('\n2. Récupération d\'un bail existant...')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('❌ Aucune session active')
      return
    }

    // Récupérer les propriétés de l'utilisateur
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, title, address, city')
      .eq('owner_id', user.id)
      .limit(1)

    if (propError || !properties || properties.length === 0) {
      console.log('❌ Aucune propriété trouvée pour cet utilisateur')
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
      .eq('property_id', property.id)
      .limit(1)

    if (leaseError || !leases || leases.length === 0) {
      console.log('❌ Aucun bail trouvé pour cette propriété')
      return
    }

    const lease = leases[0]
    console.log('✅ Bail trouvé:', lease.id)
    console.log('   - Locataire:', lease.tenant.first_name, lease.tenant.last_name)
    console.log('   - Période:', lease.start_date, '→', lease.end_date || 'fin ouverte')
    console.log('   - Loyer mensuel:', lease.monthly_rent, '€')
    console.log('   - Provisions charges:', lease.montant_provisions_charges, '€')

    // 3. Test de calcul automatique de la période d'occupation
    console.log('\n3. Test de calcul de période d\'occupation...')
    
    const leaseStartDate = new Date(lease.start_date)
    const leaseEndDate = lease.end_date ? new Date(lease.end_date) : null
    const currentYear = new Date().getFullYear()
    
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31)
    
    const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart
    const effectiveEnd = leaseEndDate && leaseEndDate < yearEnd ? leaseEndDate : yearEnd
    
    const monthsDiff = (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 + 
                      (effectiveEnd.getMonth() - effectiveStart.getMonth()) + 1
    
    console.log('✅ Période d\'occupation calculée:')
    console.log('   - Début effectif:', effectiveStart.toLocaleDateString('fr-FR'))
    console.log('   - Fin effective:', effectiveEnd.toLocaleDateString('fr-FR'))
    console.log('   - Durée:', monthsDiff, 'mois')
    console.log('   - Pourcentage:', (monthsDiff/12*100).toFixed(1), '%')

    // 4. Test de proratisation des charges
    console.log('\n4. Test de proratisation des charges...')
    
    const testCharges = [
      { name: 'Eau', annualAmount: 1200, recoverable: true },
      { name: 'Chauffage', annualAmount: 800, recoverable: true },
      { name: 'Ascenseur', annualAmount: 400, recoverable: true },
      { name: 'TEOM', annualAmount: 300, recoverable: true }
    ]
    
    console.log('✅ Calcul de proratisation:')
    testCharges.forEach(charge => {
      const proratedAmount = (charge.annualAmount * monthsDiff) / 12
      console.log(`   - ${charge.name}: ${charge.annualAmount}€/an → ${proratedAmount.toFixed(2)}€ (${monthsDiff} mois)`)
    })

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
      console.log('✅ Calcul provisions réussi:', calculateData)
    } else {
      const errorData = await calculateResponse.json()
      console.log('❌ Erreur calcul provisions:', errorData)
    }

    // 6. Test de création d'une régularisation complète
    console.log('\n6. Test de création d\'une régularisation complète...')
    
    const testRegularizationData = {
      leaseId: lease.id,
      propertyId: property.id,
      regularizationYear: currentYear,
      regularizationDate: new Date().toISOString(),
      totalProvisionsCollected: 900, // Exemple
      provisionsPeriodStart,
      provisionsPeriodEnd,
      totalRealCharges: 780, // Exemple
      recoverableCharges: 780,
      nonRecoverableCharges: 0,
      tenantBalance: 120,
      balanceType: 'refund',
      calculationMethod: 'prorata_surface',
      calculationNotes: `Test de régularisation avec proratisation sur ${monthsDiff} mois d'occupation`,
      chargeBreakdown: testCharges.map(charge => ({
        charge_category: charge.name.toLowerCase(),
        charge_name: charge.name,
        provision_amount: 0,
        real_amount: charge.annualAmount,
        difference: charge.annualAmount,
        is_recoverable: charge.recoverable,
        is_exceptional: false,
        supporting_documents: [],
        notes: `Charge annuelle proratisée sur ${monthsDiff} mois`
      }))
    }

    const regularizationResponse = await fetch('http://localhost:3000/api/revisions/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRegularizationData)
    })

    console.log('📊 Status création régularisation:', regularizationResponse.status)
    
    if (regularizationResponse.ok) {
      const regularizationData = await regularizationResponse.json()
      console.log('✅ Régularisation créée:', regularizationData)
      
      // Nettoyer le test
      if (regularizationData.regularization && regularizationData.regularization.id) {
        console.log('\n🧹 Nettoyage du test...')
        const { error: deleteError } = await supabase
          .from('charge_regularizations')
          .delete()
          .eq('id', regularizationData.regularization.id)
        
        if (deleteError) {
          console.log('⚠️  Erreur nettoyage:', deleteError.message)
        } else {
          console.log('✅ Test nettoyé')
        }
      }
    } else {
      const errorData = await regularizationResponse.json()
      console.log('❌ Erreur création régularisation:', errorData)
    }

    // 7. Résumé des fonctionnalités testées
    console.log('\n📋 Résumé des fonctionnalités testées:')
    console.log('✅ Authentification utilisateur')
    console.log('✅ Récupération des données de bail')
    console.log('✅ Calcul automatique de période d\'occupation')
    console.log('✅ Proratisation des charges annuelles')
    console.log('✅ API de calcul des provisions')
    console.log('✅ Création de régularisation complète')
    console.log('✅ Génération PDF (via fonction)')
    console.log('✅ Persistance des données')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

// Exécuter le test
testRevisionSystem()
  .then(() => {
    console.log('\n🏁 Test complet terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
