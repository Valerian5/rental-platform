const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('Vérifiez que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateDossierFacileToSupabase() {
  try {
    console.log('🚀 Migration DossierFacile vers Supabase...')
    console.log('📍 URL Supabase:', supabaseUrl)

    // Lire le script SQL
    const sqlPath = path.join(__dirname, 'create-dossierfacile-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Exécution du script SQL sur Supabase...')
    
    // Exécuter le script SQL via Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      console.error('❌ Erreur lors de l\'exécution du script SQL:', error)
      
      // Essayer une approche alternative - exécuter les commandes une par une
      console.log('🔄 Tentative d\'exécution manuelle...')
      await executeSQLManually()
    } else {
      console.log('✅ Migration terminée avec succès!')
    }

    // Vérifier que la table existe
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'dossierfacile_dossiers')

    if (tableError) {
      console.error('❌ Erreur lors de la vérification:', tableError)
    } else if (tables && tables.length > 0) {
      console.log('✅ Table dossierfacile_dossiers confirmée dans Supabase')
    } else {
      console.log('⚠️ Table dossierfacile_dossiers non trouvée - exécution manuelle requise')
      await executeSQLManually()
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

async function executeSQLManually() {
  console.log('🔧 Exécution manuelle des commandes SQL...')
  
  const commands = [
    // Créer la table
    `CREATE TABLE IF NOT EXISTS dossierfacile_dossiers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      dossierfacile_id VARCHAR(255) UNIQUE,
      dossierfacile_verification_code VARCHAR(255) UNIQUE,
      dossierfacile_pdf_url TEXT,
      dossierfacile_status VARCHAR(50) DEFAULT 'pending' CHECK (dossierfacile_status IN ('pending', 'verified', 'rejected', 'converted')),
      dossierfacile_verified_at TIMESTAMP WITH TIME ZONE,
      dossierfacile_data JSONB,
      access_token TEXT,
      refresh_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Créer les index
    `CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_tenant_id ON dossierfacile_dossiers(tenant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_verification_code ON dossierfacile_dossiers(dossierfacile_verification_code)`,
    `CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_status ON dossierfacile_dossiers(dossierfacile_status)`,
    
    // Activer RLS
    `ALTER TABLE dossierfacile_dossiers ENABLE ROW LEVEL SECURITY`,
    
    // Créer les politiques RLS
    `CREATE POLICY "Users can view their own dossierfacile dossiers" ON dossierfacile_dossiers
      FOR SELECT USING (auth.uid() = tenant_id)`,
    
    `CREATE POLICY "Users can insert their own dossierfacile dossiers" ON dossierfacile_dossiers
      FOR INSERT WITH CHECK (auth.uid() = tenant_id)`,
    
    `CREATE POLICY "Users can update their own dossierfacile dossiers" ON dossierfacile_dossiers
      FOR UPDATE USING (auth.uid() = tenant_id)`,
    
    `CREATE POLICY "Users can delete their own dossierfacile dossiers" ON dossierfacile_dossiers
      FOR DELETE USING (auth.uid() = tenant_id)`,
    
    `CREATE POLICY "Owners can view dossierfacile dossiers of applicants" ON dossierfacile_dossiers
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM applications a
          JOIN properties p ON a.property_id = p.id
          WHERE a.tenant_id = dossierfacile_dossiers.tenant_id
          AND p.owner_id = auth.uid()
        )
      )`
  ]

  for (const command of commands) {
    try {
      console.log(`📝 Exécution: ${command.substring(0, 50)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: command })
      
      if (error) {
        console.error(`❌ Erreur commande:`, error.message)
        // Continuer avec les autres commandes
      } else {
        console.log(`✅ Commande exécutée`)
      }
    } catch (err) {
      console.error(`❌ Exception commande:`, err.message)
    }
  }
}

// Exécuter la migration
migrateDossierFacileToSupabase()
