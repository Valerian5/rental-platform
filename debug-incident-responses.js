// Script de débogage pour vérifier les réponses d'incidents
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugIncidentResponses(incidentId) {
  console.log('🔍 [DEBUG] Vérification des réponses pour incident:', incidentId)
  
  // 1. Vérifier l'incident
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('id, title, created_at')
    .eq('id', incidentId)
    .single()
    
  if (incidentError) {
    console.error('❌ [DEBUG] Erreur incident:', incidentError)
    return
  }
  
  console.log('✅ [DEBUG] Incident trouvé:', incident)
  
  // 2. Vérifier les réponses
  const { data: responses, error: responsesError } = await supabase
    .from('incident_responses')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true })
    
  if (responsesError) {
    console.error('❌ [DEBUG] Erreur réponses:', responsesError)
    return
  }
  
  console.log('✅ [DEBUG] Réponses trouvées:', responses.length)
  responses.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.author_type} - ${r.author_name}: ${r.message.substring(0, 50)}...`)
  })
  
  // 3. Vérifier la structure de la table
  const { data: tableInfo, error: tableError } = await supabase
    .from('incident_responses')
    .select('*')
    .limit(1)
    
  if (!tableError && tableInfo.length > 0) {
    console.log('✅ [DEBUG] Structure de la table incident_responses:')
    console.log('  Colonnes:', Object.keys(tableInfo[0]))
  }
}

// Utilisation: node debug-incident-responses.js [incident_id]
const incidentId = process.argv[2]
if (!incidentId) {
  console.log('Usage: node debug-incident-responses.js [incident_id]')
  process.exit(1)
}

debugIncidentResponses(incidentId)
  .then(() => process.exit(0))
  .catch(console.error)
