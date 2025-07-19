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

    // Générer un token d'invitation
    const invitationToken = randomBytes(32).toString("hex")

    // Créer l'invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("admin_invitations")
      .insert({
        email,
        invitation_token: invitationToken,
        invited_by: user.id,
      })
      .select()
      .single()

    if (inviteError) {
      console.error("❌ Erreur création invitation:", inviteError)
      return NextResponse.json(
        { success: false, error: "Erreur création invitation", details: inviteError.message },
        { status: 500 },
      )
    }

    // TODO: Envoyer l'email d'invitation avec le lien
    // const invitationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/accept-invitation?token=${invitationToken}`

    console.log("✅ Invitation créée:", invitation)

    return NextResponse.json({
      success: true,
      data: {
        invitation,
        invitationLink: `/admin/accept-invitation?token=${invitationToken}`,
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
