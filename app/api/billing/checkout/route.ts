import { NextRequest, NextResponse } from "next/server"
import { getStripeServer, stripeConfig } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@supabase/supabase-js"

// Crée une session Checkout pour abonnement (plan) ou achat à l'acte (module)
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [CHECKOUT] Début de la requête")
    
    const body = await request.json()
    console.log("📦 [CHECKOUT] Body reçu:", { 
      mode: body?.mode, 
      priceId: body?.priceId, 
      plan_id: body?.plan_id,
      hasCustomerEmail: !!body?.customerEmail 
    })
    
    const { mode, priceId, quantity = 1, metadata = {}, customerEmail, successUrl, cancelUrl, plan_id } = body || {}

    if (!mode || !priceId) {
      console.log("❌ [CHECKOUT] Paramètres manquants:", { mode, priceId })
      return NextResponse.json({ error: "Paramètres requis: mode, priceId" }, { status: 400 })
    }

    console.log("🔐 [CHECKOUT] Tentative d'authentification...")
    
    // Gérer l'authentification comme les autres APIs (Bearer token ou cookies)
    const authHeader = request.headers.get("authorization") || ""
    const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
    const token = hasBearer ? authHeader.slice(7) : null
    
    console.log("🔑 [CHECKOUT] Mode auth:", { hasBearer, hasToken: !!token })
    
    const server = hasBearer
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
      : createServerClient(request)
    
    const {
      data: { user },
      error: authError
    } = await server.auth.getUser()
    
    console.log("👤 [CHECKOUT] Résultat auth:", { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message 
    })
    
    if (!user && !customerEmail) {
      console.log("❌ [CHECKOUT] Aucune authentification valide")
      return NextResponse.json({ error: "Utilisateur non authentifié ou customerEmail requis" }, { status: 401 })
    }

    console.log("💳 [CHECKOUT] Création de la session Stripe...")
    const stripe = getStripeServer()

    const sessionConfig = {
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
    }
    
    console.log("⚙️ [CHECKOUT] Configuration Stripe:", {
      mode: sessionConfig.mode,
      priceId: sessionConfig.line_items[0].price,
      customerEmail: sessionConfig.customer_email,
      userId: sessionConfig.metadata.user_id,
      planId: sessionConfig.metadata.plan_id
    })

    const session = await stripe.checkout.sessions.create(sessionConfig)
    
    console.log("✅ [CHECKOUT] Session créée:", { 
      sessionId: session.id, 
      hasUrl: !!session.url 
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error("❌ [CHECKOUT] Erreur création session Checkout:", error)
    console.error("❌ [CHECKOUT] Stack trace:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


