import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 POST /api/admin/invite")

    const supabase = createServerClient()

    // Vérifier l'authentification admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email manquant" }, { status: 400 })
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Email invalide" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("email", email)
      .single()

    if (existingUser) {
      if (existingUser.user_type === "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Cet utilisateur est déjà administrateur",
          },
          { status: 400 },
        )
      } else {
        // Mettre à jour l'utilisateur existant pour en faire un admin
        const { error: updateError } = await supabase
          .from("users")
          .update({ user_type: "admin", updated_at: new Date().toISOString() })
          .eq("id", existingUser.id)

        if (updateError) {
          console.error("❌ Erreur mise à jour utilisateur:", updateError)
          return NextResponse.json(
            {
              success: false,
              error: "Erreur mise à jour utilisateur",
              details: updateError.message,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: "Utilisateur existant promu administrateur",
        })
      }
    }

    // Générer un token d'invitation
    const invitationToken = randomBytes(32).toString("hex")

    // Vérifier si la table admin_invitations existe
    const { data: tableCheck, error: tableError } = await supabase.from("admin_invitations").select("id").limit(1)

    if (tableError) {
      console.warn("⚠️ Table admin_invitations non accessible:", tableError.message)
      return NextResponse.json(
        {
          success: false,
          error: "Table admin_invitations non accessible",
          details: "Veuillez exécuter le script scripts/add-admin-users.sql",
        },
        { status: 500 },
      )
    }

    // Créer l'invitation
    const { error: inviteError } = await supabase.from("admin_invitations").insert({
      email,
      invitation_token: invitationToken,
      invited_by: user.id, // récupérer l'ID de l'admin actuel
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
    })

    if (inviteError) {
      console.error("❌ Erreur création invitation:", inviteError)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur création invitation",
          details: inviteError.message,
        },
        { status: 500 },
      )
    }

    // TODO: Envoyer l'email d'invitation
    console.log("📧 Email d'invitation à envoyer à:", email)
    console.log("🔗 Token d'invitation:", invitationToken)

    return NextResponse.json({
      success: true,
      message: "Invitation créée avec succès",
      data: {
        email,
        token: invitationToken, // En développement seulement
      },
    })
  } catch (error) {
    console.error("❌ Erreur invitation admin:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
