import { type NextRequest, NextResponse } from "next/server"
import { authenticator } from "otplib"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 })
    }

    // Récupérer l'utilisateur et le secret temporaire
    const user = { id: 1 } // À remplacer
    const secret = "TEMP_SECRET" // À récupérer depuis la DB temporaire

    // Vérifier le code
    const isValid = authenticator.verify({ token: code, secret })

    if (isValid) {
      // Activer la 2FA pour l'utilisateur
      // await enable2FAForUser(user.id, secret)

      return NextResponse.json({ message: "2FA activé avec succès" })
    } else {
      return NextResponse.json({ error: "Code incorrect" }, { status: 400 })
    }
  } catch (error) {
    console.error("Erreur vérification 2FA:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
