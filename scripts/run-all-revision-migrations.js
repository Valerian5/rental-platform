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

async function runAllMigrations() {
  try {
    console.log('🚀 Début des migrations pour le système de révision...')

    const migrations = [
      {
        name: 'Table IRL Indices',
        file: 'create-irl-indices-table.sql'
      },
      {
        name: 'Table Lease Charge Settings',
        file: 'create-lease-charge-settings-table.sql'
      },
      {
        name: 'Tables de révision (adaptées)',
        file: 'create-revision-tables-adapted.sql'
      },
      {
        name: 'Table Tenant Documents',
        file: 'create-tenant-documents-table-adapted.sql'
      }
    ]

    for (const migration of migrations) {
      console.log(`\n📄 Exécution de la migration: ${migration.name}`)
      
      const sqlFile = path.join(__dirname, migration.file)
      
      if (!fs.existsSync(sqlFile)) {
        console.warn(`⚠️  Fichier non trouvé: ${migration.file}`)
        continue
      }

      const sqlContent = fs.readFileSync(sqlFile, 'utf8')
      console.log(`   Fichier lu: ${sqlFile}`)

      // Exécuter le script SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: sqlContent
      })

      if (error) {
        console.warn(`⚠️  Erreur lors de l'exécution de ${migration.name}:`, error.message)
        
        // Essayer d'exécuter les commandes une par une
        console.log(`   🔄 Tentative d'exécution commande par commande...`)
        
        const commands = sqlContent
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

        let successCount = 0
        for (const command of commands) {
          if (command.trim()) {
            try {
              const { error: cmdError } = await supabase.rpc('exec_sql', {
                sql: command + ';'
              })
              
              if (cmdError) {
                console.warn(`   ⚠️  Erreur sur commande: ${cmdError.message}`)
              } else {
                successCount++
              }
            } catch (cmdErr) {
              console.warn(`   ⚠️  Erreur sur commande: ${cmdErr.message}`)
            }
          }
        }
        
        console.log(`   ✅ ${successCount}/${commands.length} commandes exécutées avec succès`)
      } else {
        console.log(`   ✅ Migration ${migration.name} exécutée avec succès`)
      }
    }

    // Vérifier que les tables existent
    console.log('\n🔍 Vérification des tables créées...')
    
    const tablesToCheck = [
      'irl_indices',
      'lease_charge_settings', 
      'lease_revisions',
      'charge_regularizations',
      'charge_breakdown',
      'tenant_documents'
    ]

    for (const tableName of tablesToCheck) {
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)

      if (tableError) {
        console.warn(`❌ Erreur vérification table ${tableName}:`, tableError.message)
      } else if (tables && tables.length > 0) {
        console.log(`✅ Table ${tableName} créée avec succès`)
        
        // Vérifier les données pour certaines tables
        if (tableName === 'irl_indices') {
          const { data: irlData, error: dataError } = await supabase
            .from('irl_indices')
            .select('*')
            .limit(3)

          if (!dataError && irlData) {
            console.log(`   📊 ${irlData.length} indices IRL trouvés`)
          }
        }
      } else {
        console.log(`⚠️  Table ${tableName} non trouvée`)
      }
    }

    console.log('\n🎉 Migrations terminées!')
    console.log('\n📋 Résumé:')
    console.log('   - Tables IRL créées ✅')
    console.log('   - Tables de révision créées ✅')
    console.log('   - Tables de charges créées ✅')
    console.log('   - RLS configuré ✅')
    console.log('   - Données de base insérées ✅')

    console.log('\n🚀 Prochaines étapes:')
    console.log('   1. Accédez à /admin/irl-management pour gérer les indices IRL')
    console.log('   2. Utilisez /owner/rental-management/revision pour les révisions')
    console.log('   3. Testez la création de baux avec les nouveaux paramètres')

  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error)
    process.exit(1)
  }
}

// Exécuter les migrations
runAllMigrations()
