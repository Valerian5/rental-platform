const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration des modèles d\'état des lieux...')
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'create-etat-des-lieux-templates-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Exécuter la migration
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la migration:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration des modèles d\'état des lieux terminée avec succès!')
    console.log('📋 Table créée: etat_des_lieux_templates')
    console.log('🔐 RLS activé avec politiques pour admins et utilisateurs')
    console.log('📊 Index créés pour optimiser les performances')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

runMigration()