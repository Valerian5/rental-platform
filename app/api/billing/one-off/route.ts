import { NextRequest, NextResponse } from "next/server"
import { getStripeServer, stripeConfig } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase-server-client"

// Crée une session Checkout pour achat à l'acte d'un module (paiement unique)
export async function POST(request: NextRequest) {
  try {
    const { priceId, module_name, quantity = 1, customerEmail } = await request.json()
    if (!priceId || !module_name) {
      return NextResponse.json({ error: "Paramètres requis: priceId, module_name" }, { status: 400 })
    }

    const server = createServerClient(request)
    const {
      data: { user },
    } = await server.auth.getUser()
    if (!user && !customerEmail) {
      return NextResponse.json({ error: "Utilisateur non authentifié ou customerEmail requis" }, { status: 401 })
    }

    const stripe = getStripeServer()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity }],
      allow_promotion_codes: true,
      success_url: stripeConfig.checkoutSuccessUrl,
      cancel_url: stripeConfig.checkoutCancelUrl,
      customer_email: user?.email || customerEmail,
      metadata: {
        user_id: user?.id || "",
        module_name,
      },
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error("❌ Erreur one-off Checkout:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


