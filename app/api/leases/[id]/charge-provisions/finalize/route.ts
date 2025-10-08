import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

// Finaliser une provision de charges avec une régularisation
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const supabase = hasBearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : createServerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const body = await request.json()
    const {
      regularizationId,
      finalBalance,
      refundAmount,
      finalizationDate
    } = body

    // Vérifier les droits (propriétaire uniquement)
    const { data: lease } = await supabase
      .from("leases")
      .select("id, owner_id, tenant_id")
      .eq("id", leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    // Récupérer la provision active
    const { data: provision } = await supabase
      .from("charge_provisions")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("status", "active")
      .single()

    if (!provision) {
      return NextResponse.json({ error: "Aucune provision active trouvée" }, { status: 404 })
    }

    // Vérifier que la régularisation existe et appartient au bail
    if (regularizationId) {
      const { data: regularization } = await supabase
        .from("charge_regularizations_v2")
        .select("id, lease_id")
        .eq("id", regularizationId)
        .eq("lease_id", leaseId)
        .single()

      if (!regularization) {
        return NextResponse.json({ error: "Régularisation introuvable" }, { status: 404 })
      }
    }

    // Calculer le montant à rembourser
    const calculatedRefundAmount = provision.provision_amount - (finalBalance || 0)
    const actualRefundAmount = refundAmount !== undefined ? refundAmount : calculatedRefundAmount

    // Mettre à jour la provision
    const { error: updateError } = await supabase
      .from("charge_provisions")
      .update({
        status: "finalized",
        finalization_date: finalizationDate || new Date().toISOString().split('T')[0],
        final_regularization_id: regularizationId,
        final_balance: finalBalance,
        refund_amount: actualRefundAmount,
        updated_at: new Date().toISOString()
      })
      .eq("id", provision.id)

    if (updateError) {
      console.error("Erreur mise à jour provision:", updateError)
      return NextResponse.json({ error: "Erreur mise à jour provision" }, { status: 500 })
    }

    // Si un remboursement est dû, créer une nouvelle retenue de dépôt pour le remboursement
    if (actualRefundAmount > 0) {
      // Récupérer ou créer la retenue de dépôt
      const { data: retention } = await supabase
        .from("deposit_retentions")
        .select("id")
        .eq("lease_id", leaseId)
        .single()

      if (retention) {
        // Ajouter une ligne de remboursement
        await supabase
          .from("deposit_retention_lines")
          .insert({
            retention_id: retention.id,
            category: "charges",
            description: `Remboursement provision charges - Régularisation définitive`,
            amount: -actualRefundAmount, // Montant négatif = remboursement
            is_provisional: false
          })

        // Mettre à jour le total de la retenue
        const { data: currentRetention } = await supabase
          .from("deposit_retentions")
          .select("total_retained, amount_to_refund")
          .eq("id", retention.id)
          .single()

        if (currentRetention) {
          const newTotalRetained = Math.max(0, currentRetention.total_retained - actualRefundAmount)
          const newAmountToRefund = currentRetention.amount_to_refund + actualRefundAmount

          await supabase
            .from("deposit_retentions")
            .update({
              total_retained: newTotalRetained,
              amount_to_refund: newAmountToRefund,
              updated_at: new Date().toISOString()
            })
            .eq("id", retention.id)
        }
      }
    }

    // Notifier le locataire
    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(lease.tenant_id, {
        type: 'charge_provision_finalized',
        title: 'Régularisation des charges finalisée',
        content: `La régularisation des charges a été finalisée. ${actualRefundAmount > 0 ? `Un remboursement de ${actualRefundAmount.toFixed(2)}€ vous sera effectué.` : 'Aucun remboursement supplémentaire.'}`,
        action_url: `/tenant/leases/${leaseId}`,
        metadata: { 
          lease_id: leaseId, 
          provision_id: provision.id,
          refund_amount: actualRefundAmount,
          regularization_id: regularizationId
        }
      })
    } catch (e) {
      console.warn('Notification locataire (finalisation provision) échouée:', e)
    }

    return NextResponse.json({ 
      success: true, 
      provisionId: provision.id,
      refundAmount: actualRefundAmount
    })
  } catch (error) {
    console.error("Erreur finalisation provision:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
