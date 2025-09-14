import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Vérification des utilisateurs admin...")
    
    // Vérifier s'il existe déjà un admin
    const { data: existingAdmins, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'admin')
    
    if (checkError) {
      console.error('❌ Erreur vérification admin:', checkError)
      return NextResponse.json({ 
        success: false, 
        message: "Erreur vérification admin: " + checkError.message 
      })
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Admin existant trouvé: ${existingAdmins[0].email}`,
        admin: existingAdmins[0]
      })
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
      return NextResponse.json({ 
        success: false, 
        message: "Erreur création auth: " + authError.message 
      })
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
      return NextResponse.json({ 
        success: false, 
        message: "Erreur création profil: " + profileError.message 
      })
    }
    
    console.log('✅ Admin créé avec succès!')
    
    return NextResponse.json({ 
      success: true, 
      message: `Admin créé avec succès! Email: ${adminEmail}, Mot de passe: ${adminPassword}`,
      admin: profile
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ 
      success: false, 
      message: "Erreur: " + (error instanceof Error ? error.message : 'Erreur inconnue')
    })
  }
}
