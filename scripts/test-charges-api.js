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
  console.log('🧪 Test de l\'API /api/revisions/charges')
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

    // 2. Test GET - Récupération des régularisations
    console.log('\n2. Test GET - Récupération des régularisations...')
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('❌ Aucune session active')
      return
    }

    const getResponse = await fetch('http://localhost:3000/api/revisions/charges', {
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

    // 3. Test POST - Création d'une régularisation (simulation)
    console.log('\n3. Test POST - Création d\'une régularisation...')
    
    const testData = {
      leaseId: 'test-lease-id',
      propertyId: 'test-property-id',
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
      calculationNotes: 'Test de régularisation',
      chargeBreakdown: []
    }

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
    } else {
      const errorData = await postResponse.json()
      console.log('❌ Erreur POST:', errorData)
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
