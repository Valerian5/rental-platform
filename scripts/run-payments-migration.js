const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Début de la migration des tables de paiements...')

    // Lire le script SQL
    const sqlScriptPath = path.join(__dirname, 'create-payments-tables.sql')
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8')

    console.log('📄 Script SQL chargé:', sqlScript.length, 'caractères')

    // Exécuter la migration
    console.log('⚡ Exécution du script SQL...')
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript })

    if (error) {
      console.error('❌ Erreur lors de la migration:', error)
      process.exit(1)
    }

    console.log('✅ Migration réussie!')
    console.log('📊 Tables créées:')
    console.log('   - payments')
    console.log('   - receipts')
    console.log('   - reminders')
    console.log('   - lease_payment_configs')
    console.log('')
    console.log('🔧 Fonctions créées:')
    console.log('   - generate_monthly_payments()')
    console.log('   - update_updated_at_column()')
    console.log('')
    console.log('🔒 Politiques RLS configurées pour la sécurité')
    console.log('')
    console.log('🎉 Le module de gestion des paiements est maintenant prêt!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

// Vérifier si le script est exécuté directement
if (require.main === module) {
  runMigration()
}

module.exports = { runMigration }
