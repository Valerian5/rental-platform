const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testChargesAPI() {
  console.log('🧪 Test de l\'API /api/revisions/charges (corrigée)')
  console.log('=' .repeat(50))

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
      .select('id, title')
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
      .select('id, property_id, tenant_id')
      .eq('property_id', property.id)
      .limit(1)

    if (leaseError || !leases || leases.length === 0) {
      console.log('❌ Aucun bail trouvé pour cette propriété')
      return
    }

    const lease = leases[0]
    console.log('✅ Bail trouvé:', lease.id)

    // 3. Test POST - Création d'une régularisation
    console.log('\n3. Test POST - Création d\'une régularisation...')
    
    const testData = {
      leaseId: lease.id,
      propertyId: property.id,
      regularizationYear: 2025,
      regularizationDate: new Date().toISOString(),
      totalProvisionsCollected: 900,
      provisionsPeriodStart: '2025-01-01',
      provisionsPeriodEnd: '2025-12-31',
      totalRealCharges: 780,
      recoverableCharges: 780,
      nonRecoverableCharges: 0,
      tenantBalance: 120,
      balanceType: 'refund',
      calculationMethod: 'prorata_surface',
      calculationNotes: 'Test de régularisation avec données corrigées',
      chargeBreakdown: []
    }

    console.log('📊 Données de test:', JSON.stringify(testData, null, 2))

    const postResponse = await fetch('http://localhost:3000/api/revisions/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    console.log('📊 Status POST:', postResponse.status)
    
    if (postResponse.ok) {
      const postData = await postResponse.json()
      console.log('✅ POST réussi:', postData)
      
      // Nettoyer le test
      if (postData.regularization && postData.regularization.id) {
        console.log('\n🧹 Nettoyage du test...')
        const { error: deleteError } = await supabase
          .from('charge_regularizations')
          .delete()
          .eq('id', postData.regularization.id)
        
        if (deleteError) {
          console.log('⚠️  Erreur nettoyage:', deleteError.message)
        } else {
          console.log('✅ Test nettoyé')
        }
      }
    } else {
      const errorData = await postResponse.json()
      console.log('❌ Erreur POST:', errorData)
    }

    // 4. Test GET - Récupération des régularisations
    console.log('\n4. Test GET - Récupération des régularisations...')
    
    const getResponse = await fetch(`http://localhost:3000/api/revisions/charges?propertyId=${property.id}&year=2025`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 Status GET:', getResponse.status)
    
    if (getResponse.ok) {
      const getData = await getResponse.json()
      console.log('✅ GET réussi:', getData)
    } else {
      const errorData = await getResponse.json()
      console.log('❌ Erreur GET:', errorData)
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

// Exécuter le test
testChargesAPI()
  .then(() => {
    console.log('\n🏁 Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
