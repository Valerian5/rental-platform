const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Début de la migration charge_regularizations_v2...')
    
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'create-charge-regularizations-v2-table.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // Exécuter le SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution du SQL:', error)
      return
    }
    
    console.log('✅ Migration charge_regularizations_v2 terminée avec succès!')
    console.log('📊 Résultat:', data)
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  }
}

runMigration()
