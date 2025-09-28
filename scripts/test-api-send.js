// Script de test pour l'API d'envoi de régularisation
// Teste l'API /api/regularizations/send

const testApiSend = async () => {
  try {
    console.log('🧪 Test API /api/regularizations/send')
    
    // Récupérer un token d'authentification (simulation)
    const testData = {
      regularizationId: 'test-id',
      leaseId: 'test-lease-id', 
      year: 2024
    }
    
    console.log('📤 Envoi requête POST vers /api/regularizations/send')
    console.log('📋 Données:', testData)
    
    const response = await fetch('http://localhost:3000/api/regularizations/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📊 Status:', response.status)
    console.log('📊 Status Text:', response.statusText)
    
    const result = await response.json()
    console.log('📋 Réponse:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('✅ Test API réussi')
    } else {
      console.log('❌ Test API échoué')
    }
    
  } catch (error) {
    console.error('❌ Erreur test API:', error)
  }
}

// Exécuter le test
testApiSend()
