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

async function runIRLMigration() {
  try {
    console.log('🚀 Début de la migration IRL...')

    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'create-irl-indices-table.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    console.log('📄 Fichier SQL lu:', sqlFile)

    // Exécuter le script SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    })

    if (error) {
      console.error('❌ Erreur lors de l\'exécution du SQL:', error)
      
      // Essayer d'exécuter les commandes une par une
      console.log('🔄 Tentative d\'exécution commande par commande...')
      
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

      for (const command of commands) {
        if (command.trim()) {
          try {
            console.log('⚡ Exécution:', command.substring(0, 50) + '...')
            const { error: cmdError } = await supabase.rpc('exec_sql', {
              sql: command + ';'
            })
            
            if (cmdError) {
              console.warn('⚠️  Erreur sur commande:', cmdError.message)
            } else {
              console.log('✅ Commande exécutée avec succès')
            }
          } catch (cmdErr) {
            console.warn('⚠️  Erreur sur commande:', cmdErr.message)
          }
        }
      }
    } else {
      console.log('✅ Migration IRL exécutée avec succès')
    }

    // Vérifier que la table existe
    console.log('🔍 Vérification de la table...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'irl_indices')

    if (tableError) {
      console.error('❌ Erreur vérification table:', tableError)
    } else if (tables && tables.length > 0) {
      console.log('✅ Table irl_indices créée avec succès')
      
      // Vérifier les données
      const { data: irlData, error: dataError } = await supabase
        .from('irl_indices')
        .select('*')
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })

      if (dataError) {
        console.error('❌ Erreur récupération données:', dataError)
      } else {
        console.log(`✅ ${irlData?.length || 0} indices IRL trouvés`)
        if (irlData && irlData.length > 0) {
          console.log('📊 Exemples de données:')
          irlData.slice(0, 3).forEach(item => {
            console.log(`   - ${item.year} T${item.quarter}: ${item.value} (${item.is_active ? 'actif' : 'inactif'})`)
          })
        }
      }
    } else {
      console.log('⚠️  Table irl_indices non trouvée')
    }

    console.log('🎉 Migration IRL terminée!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration IRL:', error)
    process.exit(1)
  }
}

// Exécuter la migration
runIRLMigration()
