const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('🔍 Vérification des utilisateurs admin...')
    
    // Vérifier s'il existe déjà un admin
    const { data: existingAdmins, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'admin')
    
    if (checkError) {
      console.error('❌ Erreur vérification admin:', checkError)
      return
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ Admin existant trouvé:', existingAdmins[0].email)
      return
    }
    
    console.log('❌ Aucun admin trouvé. Création d\'un admin par défaut...')
    
    // Créer un utilisateur admin par défaut
    const adminEmail = 'admin@louer-ici.com'
    const adminPassword = 'admin123456'
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })
    
    if (authError) {
      console.error('❌ Erreur création auth:', authError)
      return
    }
    
    // Créer le profil dans la table users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'System',
        user_type: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Erreur création profil:', profileError)
      return
    }
    
    console.log('✅ Admin créé avec succès!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Mot de passe:', adminPassword)
    console.log('⚠️  Changez le mot de passe après la première connexion!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

createAdminUser()
