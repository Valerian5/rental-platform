import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, recipient, data } = body

    let success = false

    switch (type) {
      case "application_received":
        success = await emailService.sendApplicationNotification(recipient, data)
        break
      case "visit_scheduled":
        success = await emailService.sendVisitConfirmation(recipient, data)
        break
      case "payment_reminder":
        success = await emailService.sendPaymentReminder(recipient, data)
        break
      case "welcome":
        success = await emailService.sendWelcomeEmail(recipient, data)
        break
      default:
        return NextResponse.json({ error: "Type d'email non supporté" }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({ message: "Email envoyé avec succès" })
    } else {
      return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
    }
  } catch (error) {
    console.error("Erreur API emails:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
