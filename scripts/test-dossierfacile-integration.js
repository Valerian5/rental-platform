const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDossierFacileIntegration() {
  try {
    console.log('🧪 Test de l\'intégration DossierFacile...')

    // 1. Vérifier que la table existe
    console.log('\n1. Vérification de la table dossierfacile_dossiers...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'dossierfacile_dossiers')

    if (tableError) {
      console.error('❌ Erreur lors de la vérification de la table:', tableError)
      return
    }

    if (tables && tables.length > 0) {
      console.log('✅ Table dossierfacile_dossiers existe')
    } else {
      console.log('❌ Table dossierfacile_dossiers n\'existe pas')
      console.log('💡 Exécutez d\'abord: node scripts/run-dossierfacile-migration.js')
      return
    }

    // 2. Tester l'insertion d'un dossier de test
    console.log('\n2. Test d\'insertion d\'un dossier de test...')
    const testDossier = {
      tenant_id: '00000000-0000-0000-0000-000000000000', // UUID de test
      dossierfacile_id: 'DF_TEST_123456789',
      dossierfacile_verification_code: 'DF-ABC123-2024',
      dossierfacile_status: 'verified',
      dossierfacile_verified_at: new Date().toISOString(),
      dossierfacile_data: {
        personal_info: {
          first_name: 'Jean',
          last_name: 'Dupont',
          birth_date: '1990-01-15',
          birth_place: 'Paris',
          nationality: 'française',
        },
        professional_info: {
          profession: 'Développeur',
          company: 'TechCorp',
          contract_type: 'CDI',
          monthly_income: 3500,
          activity_documents: ['contrat_travail.pdf'],
        },
        financial_info: {
          total_income: 3500,
          income_sources: [
            { type: 'work', amount: 3500, documents: ['contrat_travail.pdf'] }
          ],
          tax_documents: ['avis_imposition.pdf'],
        },
        documents: {
          identity_documents: ['carte_identite.pdf'],
          income_documents: ['avis_imposition.pdf'],
          housing_documents: ['quittances_loyer.pdf'],
          other_documents: [],
        },
        verification: {
          is_verified: true,
          verification_date: new Date().toISOString(),
          verification_errors: [],
        },
      },
    }

    const { data: insertedDossier, error: insertError } = await supabase
      .from('dossierfacile_dossiers')
      .insert(testDossier)
      .select()

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError)
    } else {
      console.log('✅ Dossier de test inséré avec succès')
      console.log('📋 ID du dossier:', insertedDossier[0].id)
    }

    // 3. Tester la récupération
    console.log('\n3. Test de récupération du dossier...')
    const { data: retrievedDossier, error: retrieveError } = await supabase
      .from('dossierfacile_dossiers')
      .select('*')
      .eq('dossierfacile_verification_code', 'DF-ABC123-2024')
      .single()

    if (retrieveError) {
      console.error('❌ Erreur lors de la récupération:', retrieveError)
    } else {
      console.log('✅ Dossier récupéré avec succès')
      console.log('📊 Données récupérées:', {
        id: retrievedDossier.id,
        status: retrievedDossier.dossierfacile_status,
        has_data: !!retrievedDossier.dossierfacile_data,
        profession: retrievedDossier.dossierfacile_data?.professional_info?.profession,
        income: retrievedDossier.dossierfacile_data?.professional_info?.monthly_income,
      })
    }

    // 4. Nettoyer les données de test
    console.log('\n4. Nettoyage des données de test...')
    const { error: deleteError } = await supabase
      .from('dossierfacile_dossiers')
      .delete()
      .eq('dossierfacile_verification_code', 'DF-ABC123-2024')

    if (deleteError) {
      console.error('❌ Erreur lors du nettoyage:', deleteError)
    } else {
      console.log('✅ Données de test supprimées')
    }

    console.log('\n🎉 Test d\'intégration DossierFacile terminé avec succès!')
    console.log('\n📋 Prochaines étapes:')
    console.log('1. Configurez les variables d\'environnement DossierFacile dans .env.local')
    console.log('2. Testez l\'interface utilisateur sur /tenant/profile/rental-file')
    console.log('3. Vérifiez l\'affichage des badges dans les candidatures')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    process.exit(1)
  }
}

// Exécuter le test
testDossierFacileIntegration()
