// Script de test pour vérifier la configuration des APIs
// Teste les variables d'environnement et la connexion Supabase

const testApiConfig = async () => {
  try {
    console.log('🧪 Test configuration API')
    
    // Vérifier les variables d'environnement
    console.log('📋 Variables d\'environnement:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Définie' : '❌ Manquante')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Manquante')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Définie' : '❌ Manquante')
    
    // Tester la connexion avec le service role
    const { createClient } = require('@supabase/supabase-js')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Variables d\'environnement manquantes')
      return
    }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('🔗 Test connexion Supabase avec service role...')
    
    // Tester une requête simple
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, user_type')
      .limit(1)
    
    if (error) {
      console.log('❌ Erreur connexion Supabase:', error.message)
    } else {
      console.log('✅ Connexion Supabase réussie')
      console.log('📊 Données test:', data)
    }
    
    // Tester l'insertion d'une notification
    console.log('🔔 Test insertion notification...')
    
    const { data: notificationData, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: data?.[0]?.id || '00000000-0000-0000-0000-000000000000',
        type: 'test',
        title: 'Test notification',
        content: 'Ceci est un test de notification',
        action_url: 'https://example.com/test',
        read: false
      })
      .select()
    
    if (notificationError) {
      console.log('❌ Erreur insertion notification:', notificationError.message)
    } else {
      console.log('✅ Notification insérée avec succès:', notificationData)
      
      // Nettoyer la notification de test
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationData[0].id)
      
      console.log('🧹 Notification de test supprimée')
    }
    
  } catch (error) {
    console.error('❌ Erreur test configuration:', error)
  }
}

// Exécuter le test
testApiConfig()
