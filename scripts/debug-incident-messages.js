/**
 * Script de débogage pour vérifier les messages d'incidents
 * Ce script vérifie l'état des messages en base et les compare avec l'API
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

async function debugIncidentMessages() {
  console.log('🔍 Débogage des messages d\'incidents')
  
  try {
    // 1. Récupérer tous les incidents avec leurs réponses
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select(`
        id,
        title,
        status,
        resolution_notes,
        cost,
        resolved_date,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (incidentsError) {
      console.error('❌ Erreur récupération incidents:', incidentsError)
      return
    }
    
    console.log(`📋 ${incidents.length} incidents trouvés`)
    
    for (const incident of incidents) {
      console.log(`\n🔍 Incident: ${incident.title} (${incident.id})`)
      console.log(`   Statut: ${incident.status}`)
      console.log(`   Notes de résolution: ${incident.resolution_notes ? 'Oui' : 'Non'}`)
      
      // 2. Récupérer les réponses pour cet incident
      const { data: responses, error: responsesError } = await supabase
        .from('incident_responses')
        .select(`
          id,
          message,
          author_type,
          author_name,
          created_at,
          author_id
        `)
        .eq('incident_id', incident.id)
        .order('created_at', { ascending: true })
      
      if (responsesError) {
        console.error(`❌ Erreur récupération réponses pour ${incident.id}:`, responsesError)
        continue
      }
      
      console.log(`   📊 ${responses.length} réponses trouvées:`)
      
      responses.forEach((response, index) => {
        console.log(`     ${index + 1}. [${response.author_type}] ${response.author_name}: ${response.message.substring(0, 50)}...`)
        console.log(`        ID: ${response.id}`)
        console.log(`        Date: ${response.created_at}`)
      })
      
      // 3. Vérifier s'il y a des doublons
      const duplicateIds = responses.filter((response, index, self) => 
        self.findIndex(r => r.id === response.id) !== index
      )
      
      if (duplicateIds.length > 0) {
        console.log(`   ⚠️ DOUBLONS DÉTECTÉS: ${duplicateIds.length}`)
        duplicateIds.forEach(dup => {
          console.log(`     - ${dup.id}: ${dup.message.substring(0, 30)}...`)
        })
      }
      
      // 4. Vérifier les messages d'owner qui pourraient être confondus avec des notes de résolution
      const ownerMessages = responses.filter(r => r.author_type === 'owner')
      if (ownerMessages.length > 0) {
        console.log(`   👤 Messages d'owner: ${ownerMessages.length}`)
        ownerMessages.forEach(msg => {
          console.log(`     - ${msg.message.substring(0, 50)}...`)
        })
      }
    }
    
    console.log('\n🎯 Résumé:')
    console.log('- Vérifiez que les messages sont bien en base')
    console.log('- Vérifiez qu\'il n\'y a pas de doublons')
    console.log('- Vérifiez que les messages d\'owner ne sont pas confondus avec les notes de résolution')
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error)
  }
}

// Exécuter le débogage
debugIncidentMessages()
