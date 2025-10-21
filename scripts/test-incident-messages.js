/**
 * Script de test pour vérifier la synchronisation des messages d'incidents
 * Ce script simule l'ajout et la suppression de messages pour tester la synchronisation
 * et vérifie qu'il n'y a pas de doublons
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

async function testIncidentMessages() {
  console.log('🧪 Test de synchronisation des messages d\'incidents')
  
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
    
    // 2. Récupérer les réponses actuelles
    const { data: initialResponses, error: responsesError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (responsesError) {
      console.error('❌ Erreur récupération réponses:', responsesError)
      return
    }
    
    console.log(`📊 Réponses initiales: ${initialResponses.length}`)
    
    // 3. Ajouter une nouvelle réponse de test
    const testMessage = `Message de test - ${new Date().toISOString()}`
    const { data: newResponse, error: insertError } = await supabase
      .from('incident_responses')
      .insert({
        incident_id: incident.id,
        author_id: '00000000-0000-0000-0000-000000000000', // ID de test
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
    
    // 4. Vérifier que la réponse est visible
    const { data: updatedResponses, error: checkError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (checkError) {
      console.error('❌ Erreur vérification:', checkError)
      return
    }
    
    console.log(`📊 Réponses après ajout: ${updatedResponses.length}`)
    
    // 5. Vérifier que la nouvelle réponse est présente et qu'il n'y a pas de doublons
    const foundResponse = updatedResponses.find(r => r.id === newResponse.id)
    if (foundResponse) {
      console.log('✅ Nouvelle réponse visible dans la base de données')
    } else {
      console.error('❌ Nouvelle réponse non trouvée')
    }
    
    // Vérifier qu'il n'y a pas de doublons
    const duplicateIds = updatedResponses.filter((response, index, self) => 
      self.findIndex(r => r.id === response.id) !== index
    )
    if (duplicateIds.length > 0) {
      console.error('❌ Doublons détectés:', duplicateIds.map(d => d.id))
    } else {
      console.log('✅ Aucun doublon détecté')
    }
    
    // 6. Supprimer la réponse de test
    const { error: deleteError } = await supabase
      .from('incident_responses')
      .delete()
      .eq('id', newResponse.id)
    
    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError)
      return
    }
    
    console.log('✅ Réponse de test supprimée')
    
    // 7. Vérifier que la réponse a été supprimée
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
      console.log('✅ Synchronisation fonctionne correctement')
    } else {
      console.error('❌ Problème de synchronisation détecté')
    }
    
    console.log('🎉 Test terminé avec succès')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testIncidentMessages()
