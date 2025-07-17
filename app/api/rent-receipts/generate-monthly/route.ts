import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [GENERATE-RECEIPTS] Génération des quittances mensuelles")

    const currentDate = new Date()
    const month = currentDate.toLocaleString("fr-FR", { month: "long" })
    const year = currentDate.getFullYear()

    // Récupérer tous les baux actifs
    const { data: activeLeases, error: leasesError } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(id, title),
        tenant:users!leases_tenant_id_fkey(id, first_name, last_name),
        owner:users!leases_owner_id_fkey(id, first_name, last_name)
      `)
      .in("status", ["active", "signed"])

    if (leasesError) {
      console.error("❌ [GENERATE-RECEIPTS] Erreur récupération baux:", leasesError)
      return NextResponse.json({ success: false, error: "Erreur récupération baux" }, { status: 500 })
    }

    console.log(`📋 [GENERATE-RECEIPTS] ${activeLeases?.length || 0} baux actifs trouvés`)

    const generatedReceipts = []
    const errors = []

    for (const lease of activeLeases || []) {
      try {
        // Vérifier si la quittance n'existe pas déjà
        const { data: existingReceipt } = await supabase
          .from("rent_receipts")
          .select("id")
          .eq("lease_id", lease.id)
          .eq("month", month)
          .eq("year", year)
          .single()

        if (existingReceipt) {
          console.log(`⏭️ [GENERATE-RECEIPTS] Quittance déjà existante pour bail ${lease.id}`)
          continue
        }

        // Créer la nouvelle quittance
        const receiptData = {
          lease_id: lease.id,
          tenant_id: lease.tenant_id,
          owner_id: lease.owner_id,
          property_id: lease.property_id,
          month,
          year,
          rent_amount: lease.montant_loyer_mensuel || lease.monthly_rent || 0,
          charges_amount: lease.montant_charges || lease.charges || 0,
          total_amount:
            (lease.montant_loyer_mensuel || lease.monthly_rent || 0) + (lease.montant_charges || lease.charges || 0),
          status: "pending",
        }

        const { data: newReceipt, error: receiptError } = await supabase
          .from("rent_receipts")
          .insert(receiptData)
          .select()
          .single()

        if (receiptError) {
          console.error(`❌ [GENERATE-RECEIPTS] Erreur création quittance pour bail ${lease.id}:`, receiptError)
          errors.push({ leaseId: lease.id, error: receiptError.message })
          continue
        }

        // Créer l'entrée de suivi de paiement
        const paymentTrackingData = {
          rent_receipt_id: newReceipt.id,
          tenant_id: lease.tenant_id,
          owner_id: lease.owner_id,
          property_id: lease.property_id,
          lease_id: lease.id,
          rent_paid: 0,
          charges_paid: 0,
          total_paid: 0,
          payment_status: "pending",
        }

        const { error: trackingError } = await supabase.from("payment_tracking").insert(paymentTrackingData)

        if (trackingError) {
          console.warn(`⚠️ [GENERATE-RECEIPTS] Erreur création suivi paiement pour ${newReceipt.id}:`, trackingError)
        }

        generatedReceipts.push({
          receiptId: newReceipt.id,
          leaseId: lease.id,
          tenant: `${lease.tenant?.first_name} ${lease.tenant?.last_name}`,
          property: lease.property?.title,
          amount: receiptData.total_amount,
        })

        console.log(`✅ [GENERATE-RECEIPTS] Quittance créée pour bail ${lease.id}`)
      } catch (error) {
        console.error(`❌ [GENERATE-RECEIPTS] Erreur traitement bail ${lease.id}:`, error)
        errors.push({ leaseId: lease.id, error: error instanceof Error ? error.message : "Erreur inconnue" })
      }
    }

    console.log(
      `🎉 [GENERATE-RECEIPTS] Génération terminée: ${generatedReceipts.length} créées, ${errors.length} erreurs`,
    )

    return NextResponse.json({
      success: true,
      message: `${generatedReceipts.length} quittances générées pour ${month} ${year}`,
      generated: generatedReceipts,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        totalLeases: activeLeases?.length || 0,
        generated: generatedReceipts.length,
        errors: errors.length,
      },
    })
  } catch (error) {
    console.error("❌ [GENERATE-RECEIPTS] Erreur générale:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la génération des quittances",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}
