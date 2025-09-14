#!/usr/bin/env node

/**
 * Script pour exécuter la migration de la table etat_des_lieux_templates
 * 
 * Usage: node scripts/run-etat-des-lieux-templates-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration etat_des_lieux_templates...')
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'create-etat-des-lieux-templates-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la migration:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration exécutée avec succès!')
    console.log('📋 Table etat_des_lieux_templates créée')
    console.log('🔐 Politiques RLS configurées')
    console.log('📊 Index créés pour optimiser les performances')
    console.log('🔒 Contrainte d\'unicité ajoutée')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

// Vérifier si la fonction exec_sql existe
async function checkExecSqlFunction() {
  try {
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'exec_sql')
      .limit(1)
    
    if (error || !data || data.length === 0) {
      console.log('⚠️  La fonction exec_sql n\'existe pas. Création...')
      
      // Créer la fonction exec_sql
      const createFunctionSQL = `
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
      
      const { error: funcError } = await supabase.rpc('exec', { sql: createFunctionSQL })
      
      if (funcError) {
        console.error('❌ Erreur lors de la création de la fonction exec_sql:', funcError)
        console.log('💡 Essayez d\'exécuter manuellement le script SQL dans l\'interface Supabase')
        process.exit(1)
      }
      
      console.log('✅ Fonction exec_sql créée')
    }
  } catch (error) {
    console.log('⚠️  Impossible de vérifier la fonction exec_sql. Tentative d\'exécution directe...')
  }
}

async function main() {
  await checkExecSqlFunction()
  await runMigration()
}

main()
