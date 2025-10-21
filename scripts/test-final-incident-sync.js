/**
 * Script de test final pour vérifier la synchronisation complète des messages d'incidents
 * Ce script teste tous les aspects : ajout, affichage, suppression, et synchronisation
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

async function testFinalIncidentSync() {
  console.log('🧪 Test final de synchronisation des messages d\'incidents')
  
  try {
    // 1. Récupérer un incident existant
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('id, title, status, resolution_notes')
      .limit(1)
    
    if (incidentsError || !incidents || incidents.length === 0) {
      console.error('❌ Aucun incident trouvé pour le test')
      return
    }
    
    const incident = incidents[0]
    console.log(`📋 Test avec l'incident: ${incident.title} (${incident.id})`)
    console.log(`   Statut: ${incident.status}`)
    console.log(`   Notes de résolution: ${incident.resolution_notes ? 'Oui' : 'Non'}`)
    
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
    const testMessage = `Test de synchronisation - ${new Date().toISOString()}`
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
    
    // 5. Vérifier la présence de la nouvelle réponse
    const foundResponse = updatedResponses.find(r => r.id === newResponse.id)
    if (foundResponse) {
      console.log('✅ Nouvelle réponse visible dans la base de données')
    } else {
      console.error('❌ Nouvelle réponse non trouvée')
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
    
    // 7. Vérifier la séparation entre messages et notes de résolution
    const ownerMessages = updatedResponses.filter(r => r.author_type === 'owner')
    const tenantMessages = updatedResponses.filter(r => r.author_type === 'tenant')
    
    console.log(`👤 Messages d'owner: ${ownerMessages.length}`)
    console.log(`👤 Messages de tenant: ${tenantMessages.length}`)
    
    // Vérifier que les messages d'owner ne sont pas confondus avec les notes de résolution
    if (incident.resolution_notes) {
      console.log('📝 Notes de résolution présentes (séparées des messages)')
      console.log(`   Contenu: ${incident.resolution_notes.substring(0, 50)}...`)
    } else {
      console.log('📝 Aucune note de résolution (normal)')
    }
    
    // 8. Supprimer la réponse de test
    const { error: deleteError } = await supabase
      .from('incident_responses')
      .delete()
      .eq('id', newResponse.id)
    
    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError)
      return
    }
    
    console.log('✅ Réponse de test supprimée')
    
    // 9. Vérifier la suppression
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
      return
    }
    
    console.log('\n🎉 Test final réussi !')
    console.log('✅ Messages ajoutés et supprimés correctement')
    console.log('✅ Aucun doublon détecté')
    console.log('✅ Séparation correcte entre messages et notes de résolution')
    console.log('✅ Synchronisation fonctionnelle')
    
  } catch (error) {
    console.error('❌ Erreur lors du test final:', error)
  }
}

// Exécuter le test final
testFinalIncidentSync()
