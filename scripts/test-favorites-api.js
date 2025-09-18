// Script de test pour les endpoints API des favoris
// Ce script peut être exécuté avec Node.js pour tester les endpoints

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Fonction pour faire des requêtes HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    return { response, data }
  } catch (error) {
    console.error('Erreur de requête:', error)
    return { response: null, data: null, error }
  }
}

// Test des endpoints (nécessite un token d'authentification valide)
async function testFavoritesAPI() {
  console.log('🧪 Test des endpoints API Favoris')
  console.log('=====================================')
  
  // Remplacez par un token d'authentification valide
  const authToken = 'YOUR_AUTH_TOKEN_HERE'
  
  if (authToken === 'YOUR_AUTH_TOKEN_HERE') {
    console.log('❌ Veuillez remplacer YOUR_AUTH_TOKEN_HERE par un token valide')
    console.log('   Vous pouvez obtenir un token en vous connectant à l\'application')
    return
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  }
  
  // Test 1: Récupérer les favoris
  console.log('\n1. Test GET /api/favorites')
  const { response: getResponse, data: getData } = await makeRequest(`${BASE_URL}/api/favorites`, {
    method: 'GET',
    headers
  })
  
  if (getResponse?.ok) {
    console.log('✅ GET /api/favorites - Succès')
    console.log(`   Nombre de favoris: ${getData.data?.length || 0}`)
  } else {
    console.log('❌ GET /api/favorites - Échec')
    console.log(`   Status: ${getResponse?.status}`)
    console.log(`   Erreur: ${getData?.error || 'Inconnue'}`)
  }
  
  // Test 2: Vérifier un favori (nécessite un property_id valide)
  const testPropertyId = 'test-property-id'
  console.log(`\n2. Test GET /api/favorites/check?property_id=${testPropertyId}`)
  const { response: checkResponse, data: checkData } = await makeRequest(`${BASE_URL}/api/favorites/check?property_id=${testPropertyId}`, {
    method: 'GET',
    headers
  })
  
  if (checkResponse?.ok) {
    console.log('✅ GET /api/favorites/check - Succès')
    console.log(`   Est favori: ${checkData.isFavorite}`)
  } else {
    console.log('❌ GET /api/favorites/check - Échec')
    console.log(`   Status: ${checkResponse?.status}`)
    console.log(`   Erreur: ${checkData?.error || 'Inconnue'}`)
  }
  
  // Test 3: Toggle favori (nécessite un property_id valide)
  console.log(`\n3. Test POST /api/favorites/toggle`)
  const { response: toggleResponse, data: toggleData } = await makeRequest(`${BASE_URL}/api/favorites/toggle`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      property_id: testPropertyId
    })
  })
  
  if (toggleResponse?.ok) {
    console.log('✅ POST /api/favorites/toggle - Succès')
    console.log(`   Nouvel état: ${toggleData.isFavorite ? 'Favori' : 'Non favori'}`)
    console.log(`   Message: ${toggleData.message}`)
  } else {
    console.log('❌ POST /api/favorites/toggle - Échec')
    console.log(`   Status: ${toggleResponse?.status}`)
    console.log(`   Erreur: ${toggleData?.error || 'Inconnue'}`)
  }
  
  console.log('\n=====================================')
  console.log('🏁 Tests terminés')
}

// Exécuter les tests
if (require.main === module) {
  testFavoritesAPI().catch(console.error)
}

module.exports = { testFavoritesAPI }
