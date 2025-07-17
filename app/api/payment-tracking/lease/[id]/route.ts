import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    console.log("💳 [PAYMENT-TRACKING] Récupération paiements pour bail:", leaseId)

    const { data: payments, error } = await supabase
      .from("payment_tracking")
      .select(`
        *,
        rent_receipt:rent_receipts(
          id,
          month,
          year,
          total_amount
        )
      `)
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [PAYMENT-TRACKING] Erreur récupération:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération paiements" }, { status: 500 })
    }

    console.log("✅ [PAYMENT-TRACKING] Paiements récupérés:", payments?.length || 0)

    return NextResponse.json({
      success: true,
      payments: payments || [],
    })
  } catch (error) {
    console.error("❌ [PAYMENT-TRACKING] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
