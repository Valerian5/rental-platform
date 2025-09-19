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
    console.log('🔄 Démarrage de la migration des tables fiscales...')

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'create-expenses-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Exécuter le SQL
    console.log('📝 Exécution du script SQL...')
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      console.error('❌ Erreur lors de l\'exécution du SQL:', error)
      return
    }

    console.log('✅ Migration terminée avec succès!')
    console.log('📋 Tables créées:')
    console.log('  - expenses (dépenses fiscales)')
    console.log('  - charge_regularizations (régularisations de charges)')
    console.log('  - fiscal_summary (vue récapitulative)')
    console.log('  - rental_income_summary (vue revenus locatifs)')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  }
}

// Fonction alternative si exec_sql n'est pas disponible
async function runMigrationAlternative() {
  try {
    console.log('🔄 Démarrage de la migration alternative...')

    // Créer la table expenses
    console.log('📝 Création de la table expenses...')
    const { error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .limit(1)

    if (expensesError && expensesError.code === 'PGRST116') {
      console.log('⚠️  Table expenses n\'existe pas, veuillez exécuter le SQL manuellement')
      console.log('📄 Fichier SQL:', path.join(__dirname, 'create-expenses-table.sql'))
    } else {
      console.log('✅ Table expenses existe déjà')
    }

    // Vérifier la table charge_regularizations
    console.log('📝 Vérification de la table charge_regularizations...')
    const { error: regularizationsError } = await supabase
      .from('charge_regularizations')
      .select('id')
      .limit(1)

    if (regularizationsError && regularizationsError.code === 'PGRST116') {
      console.log('⚠️  Table charge_regularizations n\'existe pas, veuillez exécuter le SQL manuellement')
    } else {
      console.log('✅ Table charge_regularizations existe déjà')
    }

    console.log('✅ Vérification terminée!')
    console.log('📋 Pour créer les tables, exécutez le SQL dans l\'interface Supabase:')
    console.log('   https://supabase.com/dashboard/project/[votre-projet]/sql')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la migration
if (process.argv.includes('--alternative')) {
  runMigrationAlternative()
} else {
  runMigration()
}
