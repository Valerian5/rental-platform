const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Début de la migration des tables de régularisation des charges v2...')
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'create-charge-regularization-v2.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Fichier SQL lu:', sqlPath)
    
    // Exécuter le script SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    })
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution du script SQL:', error)
      return
    }
    
    console.log('✅ Migration terminée avec succès!')
    console.log('📊 Tables créées:')
    console.log('  - charge_regularizations_v2')
    console.log('  - charge_expenses')
    console.log('  - charge_supporting_documents')
    console.log('  - Index et contraintes')
    console.log('  - Politiques RLS')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  }
}

// Vérifier si la fonction exec_sql existe
async function checkExecSqlFunction() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1'
    })
    
    if (error) {
      console.log('⚠️  La fonction exec_sql n\'existe pas, création...')
      
      // Créer la fonction exec_sql
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
          RETURN 'OK';
        END;
        $$;
      `
      
      const { error: functionError } = await supabase.rpc('exec_sql', {
        sql: createFunctionSql
      })
      
      if (functionError) {
        console.error('❌ Erreur création fonction exec_sql:', functionError)
        return false
      }
      
      console.log('✅ Fonction exec_sql créée')
    }
    
    return true
  } catch (error) {
    console.error('❌ Erreur vérification fonction exec_sql:', error)
    return false
  }
}

async function main() {
  console.log('🔍 Vérification de la fonction exec_sql...')
  
  const hasExecSql = await checkExecSqlFunction()
  if (!hasExecSql) {
    console.error('❌ Impossible de créer la fonction exec_sql')
    process.exit(1)
  }
  
  await runMigration()
}

main()
