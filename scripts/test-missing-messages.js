/**
 * Script de test pour identifier pourquoi 1 message sur 4 ne s'affiche pas
 * Compare les données en base avec ce que l'API retourne
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

async function testMissingMessages() {
  console.log('🔍 Test des messages manquants')
  
  try {
    // 1. Récupérer un incident avec le plus de réponses
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select(`
        id,
        title,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (incidentsError) {
      console.error('❌ Erreur récupération incidents:', incidentsError)
      return
    }
    
    console.log(`📋 ${incidents.length} incidents trouvés`)
    
    // Trouver l'incident avec le plus de réponses
    let incidentWithMostResponses = null
    let maxResponses = 0
    
    for (const incident of incidents) {
      const { data: responses, error: responsesError } = await supabase
        .from('incident_responses')
        .select('id')
        .eq('incident_id', incident.id)
      
      if (!responsesError && responses && responses.length > maxResponses) {
        maxResponses = responses.length
        incidentWithMostResponses = incident
      }
    }
    
    if (!incidentWithMostResponses) {
      console.error('❌ Aucun incident avec des réponses trouvé')
      return
    }
    
    console.log(`\n🎯 Incident avec le plus de réponses: ${incidentWithMostResponses.title}`)
    console.log(`   ID: ${incidentWithMostResponses.id}`)
    console.log(`   Nombre de réponses: ${maxResponses}`)
    
    // 2. Récupérer TOUTES les réponses pour cet incident
    const { data: allResponses, error: allResponsesError } = await supabase
      .from('incident_responses')
      .select(`
        id,
        message,
        author_type,
        author_name,
        created_at,
        author_id,
        attachments
      `)
      .eq('incident_id', incidentWithMostResponses.id)
      .order('created_at', { ascending: true })
    
    if (allResponsesError) {
      console.error('❌ Erreur récupération réponses:', allResponsesError)
      return
    }
    
    console.log(`\n📊 ${allResponses.length} réponses trouvées en base:`)
    allResponses.forEach((response, index) => {
      console.log(`   ${index + 1}. [${response.author_type}] ${response.author_name}`)
      console.log(`      ID: ${response.id}`)
      console.log(`      Message: ${response.message.substring(0, 60)}...`)
      console.log(`      Date: ${response.created_at}`)
      console.log(`      Author ID: ${response.author_id}`)
    })
    
    // 3. Simuler exactement ce que fait l'API
    console.log('\n🔍 Simulation de l\'API...')
    
    const { data: apiResponses, error: apiError } = await supabase
      .from("incident_responses")
      .select(`
        id,
        message,
        author_type,
        author_name,
        attachments,
        created_at,
        author_id
      `)
      .eq("incident_id", incidentWithMostResponses.id)
      .order("created_at", { ascending: true })
    
    if (apiError) {
      console.error('❌ Erreur simulation API:', apiError)
      return
    }
    
    console.log(`📊 ${apiResponses.length} réponses récupérées par l'API:`)
    apiResponses.forEach((response, index) => {
      console.log(`   ${index + 1}. [${response.author_type}] ${response.author_name}`)
      console.log(`      ID: ${response.id}`)
      console.log(`      Message: ${response.message.substring(0, 60)}...`)
      console.log(`      Date: ${response.created_at}`)
    })
    
    // 4. Mapper comme l'API
    const mappedResponses = (apiResponses || []).map((r) => ({
      id: r.id,
      message: r.message,
      user_type: r.author_type,
      user_id: r.author_id,
      user_name: r.author_name || "Utilisateur",
      created_at: r.created_at,
      attachments: r.attachments || [],
    }));
    
    console.log(`\n✅ ${mappedResponses.length} réponses mappées:`)
    mappedResponses.forEach((mr, index) => {
      console.log(`   ${index + 1}. [${mr.user_type}] ${mr.user_name}`)
      console.log(`      ID: ${mr.id}`)
      console.log(`      Message: ${mr.message.substring(0, 60)}...`)
      console.log(`      Date: ${mr.created_at}`)
    })
    
    // 5. Comparer les résultats
    console.log('\n🔍 Comparaison:')
    console.log(`   Réponses en base: ${allResponses.length}`)
    console.log(`   Réponses API: ${apiResponses.length}`)
    console.log(`   Réponses mappées: ${mappedResponses.length}`)
    
    if (allResponses.length !== apiResponses.length) {
      console.error('❌ PROBLÈME: L\'API ne récupère pas toutes les réponses!')
      
      // Identifier les réponses manquantes
      const missingInApi = allResponses.filter(r => 
        !apiResponses.find(ar => ar.id === r.id)
      )
      
      console.error(`   ${missingInApi.length} réponses manquantes dans l'API:`)
      missingInApi.forEach(missing => {
        console.error(`     - ID: ${missing.id}`)
        console.error(`     - Message: ${missing.message.substring(0, 50)}...`)
        console.error(`     - Author: ${missing.author_name} (${missing.author_type})`)
        console.error(`     - Date: ${missing.created_at}`)
      })
    }
    
    if (apiResponses.length !== mappedResponses.length) {
      console.error('❌ PROBLÈME: Le mapping perd des réponses!')
    }
    
    // 6. Vérifier les réponses avec des données nulles
    const nullDataResponses = apiResponses.filter(r => 
      !r.message || 
      !r.author_type || 
      !r.author_id ||
      !r.created_at
    )
    
    if (nullDataResponses.length > 0) {
      console.error(`❌ ${nullDataResponses.length} réponses avec des données nulles:`)
      nullDataResponses.forEach(nullResp => {
        console.error(`   - ID: ${nullResp.id}`)
        console.error(`   - Message: ${nullResp.message || 'NULL'}`)
        console.error(`   - Author Type: ${nullResp.author_type || 'NULL'}`)
        console.error(`   - Author ID: ${nullResp.author_id || 'NULL'}`)
        console.error(`   - Created At: ${nullResp.created_at || 'NULL'}`)
      })
    }
    
    // 7. Vérifier les doublons
    const duplicateIds = apiResponses.filter((response, index, self) => 
      self.findIndex(r => r.id === response.id) !== index
    )
    
    if (duplicateIds.length > 0) {
      console.error(`❌ ${duplicateIds.length} doublons dans l'API:`)
      duplicateIds.forEach(dup => {
        console.error(`   - ${dup.id}: ${dup.message.substring(0, 30)}...`)
      })
    }
    
    console.log('\n🎯 Résumé:')
    if (allResponses.length === apiResponses.length && apiResponses.length === mappedResponses.length && nullDataResponses.length === 0 && duplicateIds.length === 0) {
      console.log('✅ Tous les messages sont correctement récupérés et mappés')
    } else {
      console.log('❌ Problèmes détectés dans la récupération ou le mapping des messages')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testMissingMessages()
