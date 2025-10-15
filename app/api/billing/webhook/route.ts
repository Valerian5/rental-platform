import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Readable } from "node:stream";
import { getStripeServer } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";

// ✅ Important : forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Désactiver le body parsing de Next.js (indispensable pour Stripe)
export const config = {
  api: { bodyParser: false },
};

// Helper : lire le corps brut de la requête
async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const stripe = getStripeServer();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error("[STRIPE][WEBHOOK] STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("[STRIPE][WEBHOOK] Signature manquante");
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event;
  try {
    // ⚠️ Stripe a besoin du corps brut exact (pas JSON, pas texte)
    const rawBody = await buffer(req.body as any);
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    console.log("[STRIPE][WEBHOOK] Event reçu:", event.type);
  } catch (err: any) {
    console.error("❌ Erreur de vérification Stripe:", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    // --- ROUTAGE DES ÉVÉNEMENTS ---
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event);
        break;
      case "payment_intent.succeeded":
        await handleOneOffPayment(event);
        break;
      default:
        console.log("[STRIPE][WEBHOOK] Événement ignoré:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur traitement webhook:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// --- HANDLERS D’ÉVÉNEMENTS ---

async function handleCheckoutCompleted(event: any) {
  const server = createServerClient();
  const session = event.data.object;
  console.log("[STRIPE][WEBHOOK] checkout.session.completed:", session.id);

  if (session.mode !== "subscription") return;

  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const subscriptionId = session.subscription;
  const customerId = session.customer;
  const subscriptionType = session.metadata?.subscription_type || "agency";

  if (!userId || !subscriptionId) return;

  if (subscriptionType === "owner") {
    const { error } = await server.from("owner_subscriptions").upsert(
      {
        owner_id: userId,
        plan_id: planId,
        status: "active",
        started_at: new Date().toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_status: "active",
      },
      { onConflict: "owner_id" }
    );
    if (error) console.error("[STRIPE][WEBHOOK] owner_subscriptions error:", error);
  } else {
    const { data: user } = await server.from("users").select("agency_id").eq("id", userId).single();
    const agencyId = user?.agency_id;
    if (agencyId) {
      const { error } = await server.from("agency_subscriptions").upsert(
        {
          agency_id: agencyId,
          plan_id: planId,
          status: "active",
          started_at: new Date().toISOString(),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_status: "active",
        },
        { onConflict: "agency_id" }
      );
      if (error) console.error("[STRIPE][WEBHOOK] agency_subscriptions error:", error);
    }
  }

  await server.from("billing_events").insert({ type: "checkout.session.completed", payload: session });
}

async function handleInvoicePaymentSucceeded(event: any) {
  const server = createServerClient();
  const invoice = event.data.object;
  await server.from("billing_events").insert({ type: "invoice.payment_succeeded", payload: invoice });
}

async function handleInvoicePaymentFailed(event: any) {
  const server = createServerClient();
  const invoice = event.data.object;
  await server.from("billing_events").insert({ type: "invoice.payment_failed", payload: invoice });
}

async function handleSubscriptionEvent(event: any) {
  const server = createServerClient();
  const subscription = event.data.object;

  await server.from("billing_events").insert({ type: event.type, payload: subscription });

  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trial",
    past_due: "active",
    canceled: "cancelled",
    unpaid: "cancelled",
    incomplete: "cancelled",
    incomplete_expired: "cancelled",
  };
  const mapped = statusMap[subscription.status] || "cancelled";

  const { data: agencySub } = await server
    .from("agency_subscriptions")
    .select("agency_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  const { data: ownerSub } = await server
    .from("owner_subscriptions")
    .select("owner_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (agencySub?.agency_id) {
    await server
      .from("agency_subscriptions")
      .update({ status: mapped, stripe_status: subscription.status })
      .eq("agency_id", agencySub.agency_id);
  }

  if (ownerSub?.owner_id) {
    await server
      .from("owner_subscriptions")
      .update({ status: mapped, stripe_status: subscription.status })
      .eq("owner_id", ownerSub.owner_id);
  }
}

async function handleOneOffPayment(event: any) {
  const server = createServerClient();
  const intent = event.data.object;
  await server.from("billing_events").insert({ type: "payment_intent.succeeded", payload: intent });
}
