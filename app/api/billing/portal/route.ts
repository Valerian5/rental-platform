import { NextRequest, NextResponse } from "next/server"
import { getStripeServer, stripeConfig } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase-server-client"

// Crée un lien vers le Billing Portal Stripe pour gérer l'abonnement
export async function POST(request: NextRequest) {
  try {
    const server = createServerClient(request)
    const {
      data: { user },
    } = await server.auth.getUser()

    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    // Récupérer ou créer le customer Stripe côté base (à étendre avec votre schéma)
    const stripeCustomerId = await getOrCreateStripeCustomerId(user.id, user.email || undefined)

    const stripe = getStripeServer()
    const portal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: stripeConfig.billingPortalReturnUrl,
    })

    return NextResponse.json({ url: portal.url })
  } catch (error) {
    console.error("❌ Erreur création session Billing Portal:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function getOrCreateStripeCustomerId(userId: string, email?: string): Promise<string> {
  // TODO: Remplacer par persistance réelle (table users_settings ou agency/owners)
  // Pour un POC on peut créer à la volée, puis stocker dans une table dédiée
  const stripe = getStripeServer()
  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } })
  return customer.id
}


