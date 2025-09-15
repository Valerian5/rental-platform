const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runDossierFacileMigration() {
  try {
    console.log('🚀 Démarrage de la migration DossierFacile...')

    // Lire le script SQL
    const sqlPath = path.join(__dirname, 'create-dossierfacile-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Exécution du script SQL...')
    
    // Exécuter le script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      console.error('❌ Erreur lors de l\'exécution du script SQL:', error)
      throw error
    }

    console.log('✅ Migration DossierFacile terminée avec succès!')
    console.log('📋 Table dossierfacile_dossiers créée')
    console.log('🔐 Politiques RLS configurées')
    console.log('📊 Index créés pour les performances')

    // Vérifier que la table existe
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'dossierfacile_dossiers')

    if (tableError) {
      console.error('❌ Erreur lors de la vérification:', tableError)
    } else if (tables && tables.length > 0) {
      console.log('✅ Table dossierfacile_dossiers confirmée dans la base de données')
    } else {
      console.log('⚠️ Table dossierfacile_dossiers non trouvée - vérifiez manuellement')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

// Exécuter la migration
runDossierFacileMigration()
