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
    // Récupérer l'email depuis le body de la requête
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: "Email requis" 
      })
    }

    console.log("🔍 Mise à jour de l'utilisateur vers admin:", email)
    
    // Mettre à jour le user_type vers 'admin' pour l'utilisateur avec cet email
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        user_type: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: "Erreur mise à jour: " + updateError.message 
      })
    }
    
    console.log('✅ Utilisateur mis à jour vers admin:', updatedUser.email)
    
    return NextResponse.json({ 
      success: true, 
      message: `Utilisateur ${updatedUser.email} mis à jour vers admin avec succès!`,
      user: updatedUser
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ 
      success: false, 
      message: "Erreur: " + (error instanceof Error ? error.message : 'Erreur inconnue')
    })
  }
}
