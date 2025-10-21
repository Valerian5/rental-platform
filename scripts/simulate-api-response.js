/**
 * Script pour simuler exactement ce que fait l'API incidents/[id]
 * et comparer avec les données en base
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

async function simulateApiResponse() {
  console.log('🧪 Simulation de la réponse API incidents/[id]')
  
  try {
    // 1. Récupérer un incident existant
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select(`
        id,
        title,
        description,
        category,
        priority,
        status,
        photos,
        resolution_notes,
        cost,
        resolved_date,
        created_at,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code,
          property_type,
          surface
        ),
        lease:leases(
          id,
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          owner:users!leases_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .limit(1)
    
    if (incidentsError || !incidents || incidents.length === 0) {
      console.error('❌ Aucun incident trouvé')
      return
    }
    
    const incident = incidents[0]
    console.log(`📋 Incident: ${incident.title} (${incident.id})`)
    
    // 2. Récupérer les réponses comme le fait l'API
    console.log('🔍 Récupération des réponses comme l\'API...')
    
    const { data: responses, error: responsesError } = await supabase
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
      .eq("incident_id", incident.id)
      .order("created_at", { ascending: true })
    
    console.log("📊 Réponses brutes depuis Supabase:", {
      count: responses?.length || 0,
      ids: responses?.map(r => r.id) || [],
      messages: responses?.map(r => ({ 
        id: r.id, 
        message: r.message?.substring(0, 50), 
        created_at: r.created_at,
        author_type: r.author_type,
        author_name: r.author_name
      })) || []
    })
    
    if (responsesError) {
      console.error("❌ Erreur récupération réponses:", responsesError)
      return
    }
    
    // 3. Mapper les réponses comme le fait l'API
    const mappedResponses = (responses || []).map((r) => ({
      id: r.id,
      message: r.message,
      user_type: r.author_type,
      user_id: r.author_id,
      user_name: r.author_name || "Utilisateur",
      created_at: r.created_at,
      attachments: r.attachments || [],
    }))
    
    console.log("✅ Réponses mappées à envoyer au client:", mappedResponses.length, "réponses")
    
    // 4. Afficher chaque réponse mappée
    mappedResponses.forEach((response, index) => {
      console.log(`\n   ${index + 1}. Réponse mappée:`)
      console.log(`      ID: ${response.id}`)
      console.log(`      Message: ${response.message}`)
      console.log(`      User Type: ${response.user_type}`)
      console.log(`      User Name: ${response.user_name}`)
      console.log(`      Created At: ${response.created_at}`)
      console.log(`      Attachments: ${response.attachments?.length || 0}`)
    })
    
    // 5. Vérifier les différences avec les données brutes
    console.log('\n🔍 Comparaison données brutes vs mappées:')
    console.log(`   Données brutes: ${responses.length}`)
    console.log(`   Données mappées: ${mappedResponses.length}`)
    
    if (responses.length !== mappedResponses.length) {
      console.error('❌ PROBLÈME: Nombre de réponses différent entre brut et mappé!')
    }
    
    // 6. Vérifier les réponses manquantes
    const missingInMapped = responses.filter(r => 
      !mappedResponses.find(mr => mr.id === r.id)
    )
    
    if (missingInMapped.length > 0) {
      console.error(`❌ ${missingInMapped.length} réponses manquantes dans le mapping:`)
      missingInMapped.forEach(missing => {
        console.error(`   - ID: ${missing.id}`)
        console.error(`   - Message: ${missing.message}`)
        console.error(`   - Author Type: ${missing.author_type}`)
        console.error(`   - Author Name: ${missing.author_name}`)
      })
    }
    
    // 7. Vérifier les réponses avec des données nulles
    const nullDataResponses = responses.filter(r => 
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
    
    console.log('\n🎯 Résumé de la simulation:')
    if (responses.length === mappedResponses.length && missingInMapped.length === 0 && nullDataResponses.length === 0) {
      console.log('✅ Simulation réussie - toutes les réponses sont correctement mappées')
    } else {
      console.log('❌ Problèmes détectés dans le mapping des réponses')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la simulation:', error)
  }
}

// Exécuter la simulation
simulateApiResponse()
