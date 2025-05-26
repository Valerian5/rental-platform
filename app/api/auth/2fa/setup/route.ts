import { type NextRequest, NextResponse } from "next/server"
import { authenticator } from "otplib"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur depuis la session/token
    const user = { id: 1, email: "user@example.com" } // À remplacer par la vraie logique

    // Générer un secret unique
    const secret = authenticator.generateSecret()

    // Créer l'URL pour le QR code
    const otpauth = authenticator.keyuri(user.email, "RentalPlatform", secret)

    // Générer le QR code
    const qrCodeUrl = await QRCode.toDataURL(otpauth)

    // Générer des codes de récupération
    const backupCodes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 8).toUpperCase())

    // Sauvegarder temporairement le secret (à implémenter avec votre DB)
    // await saveTemporary2FASecret(user.id, secret, backupCodes)

    return NextResponse.json({
      qrCodeUrl,
      secret,
      backupCodes,
    })
  } catch (error) {
    console.error("Erreur setup 2FA:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
