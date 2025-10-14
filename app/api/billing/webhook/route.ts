import { NextRequest, NextResponse } from "next/server"
import { getStripeServer } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase"

// Stripe envoie du JSON signé (ou du raw) suivant config; Next 14 supporte req.text()
export async function POST(request: NextRequest) {
  const stripe = getStripeServer()
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  try {
    const rawBody = await request.text()
    const signature = request.headers.get("stripe-signature")
    if (!endpointSecret || !signature) {
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret)

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event)
        break
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event)
        break
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event)
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event)
        break
      case "payment_intent.succeeded":
        await handleOneOffPayment(event)
        break
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("❌ Erreur webhook Stripe:", err)
    return NextResponse.json({ error: "Signature invalide ou erreur serveur" }, { status: 400 })
  }
}

async function handleCheckoutCompleted(event: any) {
  const server = createServerClient()
  const session = event.data.object

  // Si abonnement, lier subscriptionId et customerId à l'utilisateur / agence
  if (session.mode === "subscription") {
    const subscriptionId = session.subscription
    const customerId = session.customer
    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id
    if (userId && subscriptionId) {
      // Récupérer l'agence de l'utilisateur
      const { data: user } = await server.from("users").select("agency_id").eq("id", userId).single()
      const agencyId = user?.agency_id

      if (agencyId) {
        // Upsert de l'abonnement agence avec IDs Stripe
        await server.from("agency_subscriptions").upsert(
          {
            agency_id: agencyId,
            plan_id: planId || null,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: null,
            is_trial: false,
            trial_ends_at: null,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_status: "active",
          },
          { onConflict: "agency_id" },
        )
      }

      await server.from("billing_events").insert({ type: "checkout.session.completed", payload: session })
    }
  }
}

async function handleInvoicePaymentSucceeded(event: any) {
  const server = createServerClient()
  const invoice = event.data.object
  await server.from("billing_events").insert({ type: "invoice.payment_succeeded", payload: invoice })
}

async function handleInvoicePaymentFailed(event: any) {
  const server = createServerClient()
  const invoice = event.data.object
  await server.from("billing_events").insert({ type: "invoice.payment_failed", payload: invoice })

  // Tenter de retrouver l'agence associée au customer
  const { data: sub } = await server
    .from("agency_subscriptions")
    .select("agency_id")
    .eq("stripe_customer_id", invoice.customer)
    .single()

  if (sub?.agency_id) {
    // Marquer comme actif mais à surveiller, ou dégrader l'accès selon votre politique
    await server
      .from("agency_subscriptions")
      .update({ stripe_status: "past_due" })
      .eq("agency_id", sub.agency_id)
  }
}

async function handleSubscriptionEvent(event: any) {
  const server = createServerClient()
  const subscription = event.data.object
  await server.from("billing_events").insert({ type: event.type, payload: subscription })

  // Synchroniser agency_subscriptions.status selon subscription.status
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trial",
    past_due: "active", // accès conservé, à ajuster au besoin
    canceled: "cancelled",
    unpaid: "cancelled",
    incomplete: "cancelled",
    incomplete_expired: "cancelled",
  }
  const mapped = statusMap[subscription.status] || "cancelled"

  // Retrouver agency_id par stripe_subscription_id
  const { data: sub } = await server
    .from("agency_subscriptions")
    .select("agency_id")
    .eq("stripe_subscription_id", subscription.id)
    .single()

  if (sub?.agency_id) {
    await server
      .from("agency_subscriptions")
      .update({ status: mapped, stripe_status: subscription.status })
      .eq("agency_id", sub.agency_id)
  }
}

async function handleOneOffPayment(event: any) {
  const server = createServerClient()
  const intent = event.data.object
  await server.from("billing_events").insert({ type: "payment_intent.succeeded", payload: intent })

  // Débloquer le module acheté à l'acte pour l'utilisateur/agence
  const userId = intent.metadata?.user_id
  const moduleName = intent.metadata?.module_name
  if (userId && moduleName) {
    const { data: user } = await server.from("users").select("agency_id").eq("id", userId).single()
    const agencyId = user?.agency_id
    if (agencyId) {
      // Enregistrer l'achat à l'acte
      await server.from("one_off_purchases").insert({
        user_id: userId,
        module_id: (await getModuleId(server, moduleName)) || undefined,
        stripe_payment_intent_id: intent.id,
        amount_cents: intent.amount_received,
        currency: intent.currency,
        status: intent.status,
      })
    }
  }
}

async function getModuleId(server: any, moduleName: string): Promise<string | null> {
  const { data } = await server.from("premium_modules").select("id").eq("name", moduleName).maybeSingle()
  return data?.id || null
}


