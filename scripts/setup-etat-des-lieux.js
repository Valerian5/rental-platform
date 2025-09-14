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

async function setupEtatDesLieux() {
  try {
    console.log('🚀 Configuration complète de l\'état des lieux...')
    
    // 1. Créer la table des documents d'état des lieux
    console.log('📋 Création de la table etat_des_lieux_documents...')
    const documentsSqlPath = path.join(__dirname, 'create-etat-des-lieux-table.sql')
    const documentsSqlContent = fs.readFileSync(documentsSqlPath, 'utf8')
    
    const { error: documentsError } = await supabase.rpc('exec_sql', { sql: documentsSqlContent })
    if (documentsError) {
      console.error('❌ Erreur création table documents:', documentsError)
    } else {
      console.log('✅ Table etat_des_lieux_documents créée')
    }
    
    // 2. Créer la table des modèles d'état des lieux
    console.log('📋 Création de la table etat_des_lieux_templates...')
    const templatesSqlPath = path.join(__dirname, 'create-etat-des-lieux-templates-table.sql')
    const templatesSqlContent = fs.readFileSync(templatesSqlPath, 'utf8')
    
    const { error: templatesError } = await supabase.rpc('exec_sql', { sql: templatesSqlContent })
    if (templatesError) {
      console.error('❌ Erreur création table templates:', templatesError)
    } else {
      console.log('✅ Table etat_des_lieux_templates créée')
    }
    
    // 3. Vérifier que les tables existent
    console.log('🔍 Vérification des tables...')
    
    const { data: documentsTable, error: documentsCheck } = await supabase
      .from('etat_des_lieux_documents')
      .select('id')
      .limit(1)
    
    if (documentsCheck) {
      console.error('❌ Table etat_des_lieux_documents non accessible:', documentsCheck)
    } else {
      console.log('✅ Table etat_des_lieux_documents accessible')
    }
    
    const { data: templatesTable, error: templatesCheck } = await supabase
      .from('etat_des_lieux_templates')
      .select('id')
      .limit(1)
    
    if (templatesCheck) {
      console.error('❌ Table etat_des_lieux_templates non accessible:', templatesCheck)
    } else {
      console.log('✅ Table etat_des_lieux_templates accessible')
    }
    
    console.log('🎉 Configuration de l\'état des lieux terminée!')
    console.log('📝 Vous pouvez maintenant:')
    console.log('   - Accéder à /admin/etat-des-lieux-templates pour gérer les modèles')
    console.log('   - Utiliser l\'état des lieux numérique dans les baux')
    console.log('   - Télécharger des modèles PDF personnalisés')
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
    process.exit(1)
  }
}

setupEtatDesLieux()
