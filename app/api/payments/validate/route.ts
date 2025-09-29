import { NextRequest, NextResponse } from "next/server"
import { createClient, createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    )

    const { data: auth, error: userError } = await supabase.auth.getUser()
    if (userError || !auth?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { payment_id, status, payment_date, payment_method, notes } = body || {}

    if (!payment_id || !status) {
      return NextResponse.json({ error: "Paramètres manquants (payment_id, status)" }, { status: 400 })
    }

    const db = createServerClient()

    let rpcError: any = null
    if (status === "paid") {
      const { error } = await db.rpc("mark_payment_as_paid", {
        payment_id_param: payment_id,
        payment_date_param: payment_date || new Date().toISOString(),
        payment_method_param: payment_method || "virement",
      })
      if (error) rpcError = error
    } else {
      const { error } = await db.rpc("mark_payment_as_unpaid", {
        payment_id_param: payment_id,
        notes_param: notes,
      })
      if (error) rpcError = error
    }

    if (rpcError) {
      console.error("Erreur validation paiement:", rpcError)
      return NextResponse.json({ error: "Erreur lors de la validation du paiement" }, { status: 500 })
    }

    // Générer quittance si payé
    let receipt: any = null
    if (status === "paid") {
      const { data, error } = await db.rpc("generate_receipt_for_payment", { payment_id_param: payment_id })
      if (error) {
        console.error("Erreur génération quittance:", error)
      } else {
        receipt = Array.isArray(data) ? data[0] : data
      }
    }

    // Récupérer le paiement enrichi (tenant, owner, property)
    const { data: payment, error: paymentError } = await db
      .from("payments")
      .select(
        `*,
        lease:leases!payments_lease_id_fkey(
          id,
          owner_id,
          tenant:users!leases_tenant_id_fkey(id, first_name, last_name, email),
          property:properties(id, title, address)
        )`,
      )
      .eq("id", payment_id)
      .single()

    if (paymentError || !payment) {
      console.error("Paiement introuvable pour notification:", paymentError)
    } else if (status === "paid") {
      // Notification + Email au locataire
      try {
        const { notificationsService } = await import("@/lib/notifications-service")
        await notificationsService.createNotification(payment.lease.tenant.id, {
          type: "payment_confirmed",
          title: "Paiement confirmé",
          content: `Votre paiement de ${payment.amount_due}€ a été confirmé`,
          action_url: "/tenant/payments",
        })
      } catch (e) {
        console.error("Erreur création notification paiement:", e)
      }

      try {
        const { sendPaymentConfirmationEmail } = await import("@/lib/email-service")
        await sendPaymentConfirmationEmail(
          {
            id: payment.lease.tenant.id,
            name: `${payment.lease.tenant.first_name} ${payment.lease.tenant.last_name}`,
            email: payment.lease.tenant.email,
          },
          Number(payment.amount_due),
          "/tenant/payments",
        )
      } catch (e) {
        console.error("Erreur envoi email confirmation paiement:", e)
      }
    }

    return NextResponse.json({
      success: true,
      payment_id,
      receipt,
    })
  } catch (error) {
    console.error("Erreur API validate payment:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


