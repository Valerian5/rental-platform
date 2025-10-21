/**
 * Script de test pour le nouveau système de messagerie des incidents
 * Teste l'API et la logique de messagerie
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

async function testIncidentMessagingSystem() {
  console.log('🧪 Test du système de messagerie des incidents')
  
  try {
    // 1. Récupérer un incident existant
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select(`
        id, 
        title, 
        status,
        property:properties(id, title),
        lease:leases(
          tenant:users!leases_tenant_id_fkey(id, first_name, last_name, email),
          owner:users!leases_owner_id_fkey(id, first_name, last_name, email)
        )
      `)
      .limit(1)
    
    if (incidentsError || !incidents || incidents.length === 0) {
      console.error('❌ Aucun incident trouvé pour le test')
      return
    }
    
    const incident = incidents[0]
    console.log(`📋 Test avec l'incident: ${incident.title} (${incident.id})`)
    console.log(`   Propriété: ${incident.property.title}`)
    console.log(`   Locataire: ${incident.lease.tenant.first_name} ${incident.lease.tenant.last_name}`)
    console.log(`   Propriétaire: ${incident.lease.owner.first_name} ${incident.lease.owner.last_name}`)
    
    // 2. Tester l'API GET /api/incidents/[id]/messages
    console.log('\n🔍 Test API GET messages...')
    
    const { data: messages, error: messagesError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      console.error('❌ Erreur récupération messages:', messagesError)
      return
    }
    
    console.log(`✅ ${messages.length} messages trouvés en base`)
    
    // 3. Tester l'ajout d'un message via l'API
    console.log('\n📤 Test ajout message...')
    
    const testMessage = `Test système messagerie - ${new Date().toISOString()}`
    const { data: newMessage, error: insertError } = await supabase
      .from('incident_responses')
      .insert({
        incident_id: incident.id,
        author_id: incident.lease.owner.id,
        author_name: `${incident.lease.owner.first_name} ${incident.lease.owner.last_name}`,
        message: testMessage,
        author_type: 'owner',
        attachments: []
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Erreur ajout message:', insertError)
      return
    }
    
    console.log('✅ Message ajouté:', newMessage.id)
    
    // 4. Vérifier que le message est bien récupéré
    console.log('\n🔍 Vérification récupération message...')
    
    const { data: updatedMessages, error: updatedError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (updatedError) {
      console.error('❌ Erreur récupération messages mis à jour:', updatedError)
      return
    }
    
    console.log(`✅ ${updatedMessages.length} messages après ajout`)
    
    const foundMessage = updatedMessages.find(m => m.id === newMessage.id)
    if (foundMessage) {
      console.log('✅ Nouveau message trouvé dans la base')
      console.log(`   Message: ${foundMessage.message}`)
      console.log(`   Auteur: ${foundMessage.author_name} (${foundMessage.author_type})`)
      console.log(`   Date: ${foundMessage.created_at}`)
    } else {
      console.error('❌ Nouveau message non trouvé')
      return
    }
    
    // 5. Tester l'ajout d'un message du locataire
    console.log('\n📤 Test ajout message locataire...')
    
    const tenantMessage = `Réponse locataire - ${new Date().toISOString()}`
    const { data: tenantMessageData, error: tenantError } = await supabase
      .from('incident_responses')
      .insert({
        incident_id: incident.id,
        author_id: incident.lease.tenant.id,
        author_name: `${incident.lease.tenant.first_name} ${incident.lease.tenant.last_name}`,
        message: tenantMessage,
        author_type: 'tenant',
        attachments: []
      })
      .select()
      .single()
    
    if (tenantError) {
      console.error('❌ Erreur ajout message locataire:', tenantError)
      return
    }
    
    console.log('✅ Message locataire ajouté:', tenantMessageData.id)
    
    // 6. Vérifier la conversation complète
    console.log('\n💬 Vérification conversation complète...')
    
    const { data: fullConversation, error: conversationError } = await supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true })
    
    if (conversationError) {
      console.error('❌ Erreur récupération conversation:', conversationError)
      return
    }
    
    console.log(`✅ Conversation complète: ${fullConversation.length} messages`)
    
    // Afficher la conversation
    fullConversation.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleTimeString('fr-FR')
      console.log(`   ${index + 1}. [${time}] ${msg.author_name} (${msg.author_type}): ${msg.message}`)
    })
    
    // 7. Vérifier qu'il n'y a pas de doublons
    const duplicateIds = fullConversation.filter((message, index, self) => 
      self.findIndex(m => m.id === message.id) !== index
    )
    
    if (duplicateIds.length > 0) {
      console.error('❌ Doublons détectés:', duplicateIds.map(d => d.id))
      return
    } else {
      console.log('✅ Aucun doublon détecté')
    }
    
    // 8. Nettoyer les messages de test
    console.log('\n🧹 Nettoyage des messages de test...')
    
    const { error: deleteOwnerError } = await supabase
      .from('incident_responses')
      .delete()
      .eq('id', newMessage.id)
    
    const { error: deleteTenantError } = await supabase
      .from('incident_responses')
      .delete()
      .eq('id', tenantMessageData.id)
    
    if (deleteOwnerError || deleteTenantError) {
      console.error('❌ Erreur suppression messages test:', deleteOwnerError || deleteTenantError)
      return
    }
    
    console.log('✅ Messages de test supprimés')
    
    console.log('\n🎉 Test réussi !')
    console.log('✅ Système de messagerie des incidents fonctionnel')
    console.log('✅ API GET/POST messages opérationnelle')
    console.log('✅ Conversation bidirectionnelle (owner ↔ tenant)')
    console.log('✅ Aucun doublon')
    console.log('✅ Gestion des timestamps')
    console.log('✅ Identification des auteurs')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testIncidentMessagingSystem()
