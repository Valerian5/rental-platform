/**
 * Script de diagnostic pour identifier pourquoi certains messages ne s'affichent pas
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

async function diagnoseMissingMessages() {
  console.log('🔍 Diagnostic des messages manquants')
  
  try {
    // 1. Récupérer tous les incidents avec leurs réponses
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select(`
        id,
        title,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (incidentsError) {
      console.error('❌ Erreur récupération incidents:', incidentsError)
      return
    }
    
    console.log(`📋 ${incidents.length} incidents trouvés`)
    
    for (const incident of incidents) {
      console.log(`\n🔍 Incident: ${incident.title} (${incident.id})`)
      console.log(`   Statut: ${incident.status}`)
      console.log(`   Créé: ${incident.created_at}`)
      
      // 2. Récupérer TOUTES les réponses pour cet incident (directement en base)
      const { data: allResponses, error: allResponsesError } = await supabase
        .from('incident_responses')
        .select(`
          id,
          message,
          author_type,
          author_name,
          created_at,
          author_id,
          incident_id
        `)
        .eq('incident_id', incident.id)
        .order('created_at', { ascending: true })
      
      if (allResponsesError) {
        console.error(`❌ Erreur récupération réponses pour ${incident.id}:`, allResponsesError)
        continue
      }
      
      console.log(`   📊 ${allResponses.length} réponses trouvées en base:`)
      
      allResponses.forEach((response, index) => {
        console.log(`     ${index + 1}. [${response.author_type}] ${response.author_name}`)
        console.log(`        ID: ${response.id}`)
        console.log(`        Message: ${response.message.substring(0, 80)}...`)
        console.log(`        Date: ${response.created_at}`)
        console.log(`        Author ID: ${response.author_id}`)
      })
      
      // 3. Vérifier s'il y a des réponses avec des données manquantes
      const problematicResponses = allResponses.filter(r => 
        !r.message || 
        !r.author_type || 
        !r.author_name || 
        !r.created_at ||
        !r.author_id
      )
      
      if (problematicResponses.length > 0) {
        console.log(`   ⚠️ ${problematicResponses.length} réponses avec des données manquantes:`)
        problematicResponses.forEach(pr => {
          console.log(`     - ID: ${pr.id}`)
          console.log(`       Message: ${pr.message || 'MANQUANT'}`)
          console.log(`       Author Type: ${pr.author_type || 'MANQUANT'}`)
          console.log(`       Author Name: ${pr.author_name || 'MANQUANT'}`)
          console.log(`       Created At: ${pr.created_at || 'MANQUANT'}`)
          console.log(`       Author ID: ${pr.author_id || 'MANQUANT'}`)
        })
      }
      
      // 4. Vérifier les doublons
      const duplicateIds = allResponses.filter((response, index, self) => 
        self.findIndex(r => r.id === response.id) !== index
      )
      
      if (duplicateIds.length > 0) {
        console.log(`   ⚠️ ${duplicateIds.length} doublons détectés:`)
        duplicateIds.forEach(dup => {
          console.log(`     - ${dup.id}: ${dup.message.substring(0, 30)}...`)
        })
      }
      
      // 5. Vérifier les réponses récentes (dernières 24h)
      const recentResponses = allResponses.filter(r => {
        const responseDate = new Date(r.created_at)
        const now = new Date()
        const diffHours = (now - responseDate) / (1000 * 60 * 60)
        return diffHours <= 24
      })
      
      console.log(`   🕐 ${recentResponses.length} réponses récentes (24h)`)
      
      // 6. Vérifier les types d'auteurs
      const ownerResponses = allResponses.filter(r => r.author_type === 'owner')
      const tenantResponses = allResponses.filter(r => r.author_type === 'tenant')
      
      console.log(`   👤 Messages d'owner: ${ownerResponses.length}`)
      console.log(`   👤 Messages de tenant: ${tenantResponses.length}`)
      
      // 7. Vérifier les messages vides ou très courts
      const shortMessages = allResponses.filter(r => 
        !r.message || r.message.trim().length < 3
      )
      
      if (shortMessages.length > 0) {
        console.log(`   ⚠️ ${shortMessages.length} messages très courts ou vides:`)
        shortMessages.forEach(sm => {
          console.log(`     - ID: ${sm.id}, Message: "${sm.message}"`)
        })
      }
      
      // 8. Vérifier les messages avec des caractères spéciaux
      const specialCharMessages = allResponses.filter(r => 
        r.message && /[^\x20-\x7E]/.test(r.message)
      )
      
      if (specialCharMessages.length > 0) {
        console.log(`   ⚠️ ${specialCharMessages.length} messages avec caractères spéciaux:`)
        specialCharMessages.forEach(scm => {
          console.log(`     - ID: ${scm.id}, Message: ${scm.message.substring(0, 50)}...`)
        })
      }
    }
    
    console.log('\n🎯 Résumé du diagnostic:')
    console.log('- Vérifiez les réponses avec des données manquantes')
    console.log('- Vérifiez les doublons')
    console.log('- Vérifiez les messages très courts ou vides')
    console.log('- Vérifiez les caractères spéciaux dans les messages')
    console.log('- Comparez avec ce que l\'API retourne')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécuter le diagnostic
diagnoseMissingMessages()
