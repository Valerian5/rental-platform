import { NextRequest, NextResponse } from "next/server"
import { getStripeServer, stripeConfig } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase-server-client"

// Crée une session Checkout pour abonnement (plan) ou achat à l'acte (module)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, priceId, quantity = 1, metadata = {}, customerEmail, successUrl, cancelUrl, plan_id } = body || {}

    if (!mode || !priceId) {
      return NextResponse.json({ error: "Paramètres requis: mode, priceId" }, { status: 400 })
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
      mode, // 'subscription' | 'payment'
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      allow_promotion_codes: true,
      success_url: successUrl || stripeConfig.checkoutSuccessUrl,
      cancel_url: cancelUrl || stripeConfig.checkoutCancelUrl,
      customer_email: user?.email || customerEmail,
      metadata: {
        user_id: user?.id || "",
        plan_id: plan_id || "",
        subscription_type: mode === "subscription" ? "owner" : "agency", // Indique le type d'abonnement
        ...metadata,
      },
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error("❌ Erreur création session Checkout:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


