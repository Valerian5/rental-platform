import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const supabase = createServerClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Mettre à jour le mot de passe dans la base de données
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erreur mise à jour mot de passe:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      )
    }

    // Optionnel : Mettre à jour le mot de passe dans Supabase Auth
    // (si vous voulez synchroniser avec Supabase Auth)
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      )
      
      if (authError) {
        console.warn('Erreur synchronisation Supabase Auth:', authError)
        // Ne pas faire échouer la requête si la sync échoue
      }
    } catch (syncError) {
      console.warn('Erreur synchronisation auth:', syncError)
      // Continuer même si la synchronisation échoue
    }

    console.log('Mot de passe réinitialisé pour:', user.email)
    return NextResponse.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    })

  } catch (error) {
    console.error('Erreur API reset password:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
