import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur
    const user = { id: 1 } // À remplacer

    // Désactiver la 2FA
    // await disable2FAForUser(user.id)

    return NextResponse.json({ message: "2FA désactivé avec succès" })
  } catch (error) {
    console.error("Erreur désactivation 2FA:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
