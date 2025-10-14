import Stripe from "stripe"

const apiVersion: Stripe.LatestApiVersion = "2024-06-20"

export function getStripeServer(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY manquant dans l'environnement")
  }
  return new Stripe(secretKey, { apiVersion })
}

export const stripeConfig = {
  checkoutSuccessUrl: process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    : "http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}",
  checkoutCancelUrl: process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/billing/cancel`
    : "http://localhost:3000/billing/cancel",
  billingPortalReturnUrl: process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/billing`
    : "http://localhost:3000/billing",
}


