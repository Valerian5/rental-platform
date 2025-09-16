#!/usr/bin/env node

/**
 * Script de migration DossierFacile pour Supabase
 * Exécute le script SQL pour créer les tables nécessaires
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration DossierFacile...')
    
    // Lire le script SQL
    const sqlPath = path.join(__dirname, 'create-dossierfacile-supabase.sql')
    const sqlScript = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Script SQL chargé:', sqlPath)
    
    // Exécuter le script SQL
    console.log('⚡ Exécution du script SQL...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript })
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration DossierFacile terminée avec succès !')
    console.log('📊 Tables créées:')
    console.log('   - Colonnes ajoutées à rental_files')
    console.log('   - dossierfacile_dossiers (OAuth2)')
    console.log('   - dossierfacile_webhooks')
    console.log('   - dossierfacile_logs')
    console.log('   - Vue rental_files_with_dossierfacile')
    console.log('   - Politiques RLS activées')
    
    // Vérifier que les tables existent
    console.log('\n🔍 Vérification des tables...')
    
    const tables = [
      'dossierfacile_dossiers',
      'dossierfacile_webhooks', 
      'dossierfacile_logs'
    ]
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (tableError) {
        console.error(`❌ Erreur table ${table}:`, tableError.message)
      } else {
        console.log(`✅ Table ${table} accessible`)
      }
    }
    
    // Vérifier les colonnes ajoutées à rental_files
    console.log('\n🔍 Vérification des colonnes rental_files...')
    const { data: rentalFilesData, error: rentalFilesError } = await supabase
      .from('rental_files')
      .select('dossierfacile_id, dossierfacile_status, dossierfacile_data')
      .limit(1)
    
    if (rentalFilesError) {
      console.error('❌ Erreur colonnes rental_files:', rentalFilesError.message)
    } else {
      console.log('✅ Colonnes DossierFacile ajoutées à rental_files')
    }
    
    console.log('\n🎉 Migration terminée ! Vous pouvez maintenant utiliser DossierFacile.')
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Configurer les variables d\'environnement DossierFacile')
    console.log('   2. Tester l\'intégration avec le lien simple')
    console.log('   3. Demander l\'accès à DossierFacile Connect (OAuth2)')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  }
}

// Fonction pour exécuter du SQL brut (si RPC n'est pas disponible)
async function executeRawSQL() {
  try {
    console.log('🔄 Tentative d\'exécution SQL brut...')
    
    // Diviser le script en requêtes individuelles
    const sqlScript = fs.readFileSync(path.join(__dirname, 'create-dossierfacile-supabase.sql'), 'utf8')
    const queries = sqlScript
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))
    
    console.log(`📊 ${queries.length} requêtes à exécuter`)
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      if (query.trim()) {
        try {
          console.log(`⚡ Exécution requête ${i + 1}/${queries.length}...`)
          const { error } = await supabase.rpc('exec', { sql: query })
          
          if (error) {
            console.warn(`⚠️  Avertissement requête ${i + 1}:`, error.message)
          } else {
            console.log(`✅ Requête ${i + 1} exécutée`)
          }
        } catch (err) {
          console.warn(`⚠️  Erreur requête ${i + 1}:`, err.message)
        }
      }
    }
    
    console.log('✅ Migration SQL brut terminée')
    
  } catch (error) {
    console.error('❌ Erreur exécution SQL brut:', error)
    throw error
  }
}

// Exécuter la migration
if (require.main === module) {
  runMigration().catch(async (error) => {
    if (error.message.includes('exec_sql')) {
      console.log('🔄 RPC exec_sql non disponible, tentative avec SQL brut...')
      await executeRawSQL()
    } else {
      console.error('❌ Migration échouée:', error)
      process.exit(1)
    }
  })
}

module.exports = { runMigration, executeRawSQL }
