/**
 * Script de test pour vérifier l'approche simplifiée basée sur le système de messagerie
 * Teste l'envoi et la récupération des messages d'incidents
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSimpleMessagingApproach() {
  console.log('🧪 Test de l\'approche simplifiée basée sur le système de messagerie')
  
  try {
    // 1. Récupérer un incident existant
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('id, title')
      .limit(1)
    
    if (incidentsError || !incidents || incidents.length === 0) {
      console.error('❌ Aucun incident trouvé pour le test')
      return
    }
    
    const incident = incidents[0]
    console.log(`📋 Test avec l'incident: ${incident.title} (${incident.id})`)
    
    // 2. Récupérer les réponses initiales
    const { data: initialResponses, error: initialError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (initialError) {
      console.error('❌ Erreur récupération réponses initiales:', initialError)
      return
    }
    
    console.log(`📊 Réponses initiales: ${initialResponses.length}`)
    
    // 3. Ajouter une réponse de test
    const testMessage = `Test approche simplifiée - ${new Date().toISOString()}`
    const { data: newResponse, error: insertError } = await supabase
      .from('incident_responses')
      .insert({
        incident_id: incident.id,
        author_id: '00000000-0000-0000-0000-000000000000',
        author_name: 'Test User',
        message: testMessage,
        author_type: 'owner',
        attachments: []
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Erreur ajout réponse:', insertError)
      return
    }
    
    console.log('✅ Nouvelle réponse ajoutée:', newResponse.id)
    
    // 4. Simuler le rechargement comme dans le système de messagerie
    console.log('🔄 Simulation du rechargement des données...')
    
    const { data: updatedResponses, error: reloadError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (reloadError) {
      console.error('❌ Erreur rechargement:', reloadError)
      return
    }
    
    console.log(`📊 Réponses après rechargement: ${updatedResponses.length}`)
    
    // 5. Vérifier que la nouvelle réponse est présente
    const foundResponse = updatedResponses.find(r => r.id === newResponse.id)
    if (foundResponse) {
      console.log('✅ Nouvelle réponse visible après rechargement')
      console.log(`   Message: ${foundResponse.message}`)
      console.log(`   Author: ${foundResponse.author_name} (${foundResponse.author_type})`)
      console.log(`   Date: ${foundResponse.created_at}`)
    } else {
      console.error('❌ Nouvelle réponse non trouvée après rechargement')
      return
    }
    
    // 6. Vérifier qu'il n'y a pas de doublons
    const duplicateIds = updatedResponses.filter((response, index, self) => 
      self.findIndex(r => r.id === response.id) !== index
    )
    
    if (duplicateIds.length > 0) {
      console.error('❌ Doublons détectés:', duplicateIds.map(d => d.id))
      return
    } else {
      console.log('✅ Aucun doublon détecté')
    }
    
    // 7. Supprimer la réponse de test
    const { error: deleteError } = await supabase
      .from('incident_responses')
      .delete()
      .eq('id', newResponse.id)
    
    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError)
      return
    }
    
    console.log('✅ Réponse de test supprimée')
    
    // 8. Vérifier la suppression
    const { data: finalResponses, error: finalError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError)
      return
    }
    
    console.log(`📊 Réponses finales: ${finalResponses.length}`)
    
    if (finalResponses.length === initialResponses.length) {
      console.log('✅ Approche simplifiée fonctionne correctement')
    } else {
      console.error('❌ Problème avec l\'approche simplifiée')
      return
    }
    
    console.log('\n🎉 Test réussi !')
    console.log('✅ L\'approche simplifiée basée sur le système de messagerie fonctionne')
    console.log('✅ Envoi et rechargement immédiat des messages')
    console.log('✅ Aucun doublon')
    console.log('✅ Synchronisation fiable')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testSimpleMessagingApproach()
