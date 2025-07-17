import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    console.log("🔍 [RENT-RECEIPTS] Récupération quittances pour bail:", leaseId)

    const { data: receipts, error } = await supabase
      .from("rent_receipts")
      .select("*")
      .eq("lease_id", leaseId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })

    if (error) {
      console.error("❌ [RENT-RECEIPTS] Erreur récupération:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération quittances" }, { status: 500 })
    }

    console.log("✅ [RENT-RECEIPTS] Quittances récupérées:", receipts?.length || 0)

    return NextResponse.json({
      success: true,
      receipts: receipts || [],
    })
  } catch (error) {
    console.error("❌ [RENT-RECEIPTS] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
