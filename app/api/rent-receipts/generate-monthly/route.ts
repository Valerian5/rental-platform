import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [GENERATE-RECEIPTS] Génération des quittances mensuelles")

    const currentDate = new Date()
    const currentMonth = (currentDate.getMonth() + 1).toString()
    const currentYear = currentDate.getFullYear()

    // Récupérer tous les baux actifs
    const { data: activeLeases, error: leasesError } = await supabase
      .from("leases")
      .select(`
        id,
        tenant_id,
        owner_id,
        property_id,
        monthly_rent,
        charges,
        start_date,
        end_date,
        status
      `)
      .in("status", ["active", "signed"])
      .lte("start_date", currentDate.toISOString().split("T")[0])
      .gte("end_date", currentDate.toISOString().split("T")[0])

    if (leasesError) {
      console.error("❌ [GENERATE-RECEIPTS] Erreur récupération baux:", leasesError)
      return NextResponse.json({ success: false, error: "Erreur récupération baux" }, { status: 500 })
    }

    console.log(`📋 [GENERATE-RECEIPTS] ${activeLeases?.length || 0} baux actifs trouvés`)

    const receiptsToCreate = []
    const existingReceipts = []

    for (const lease of activeLeases || []) {
      // Vérifier si la quittance existe déjà
      const { data: existingReceipt, error: checkError } = await supabase
        .from("rent_receipts")
        .select("id")
        .eq("lease_id", lease.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("❌ [GENERATE-RECEIPTS] Erreur vérification:", checkError)
        continue
      }

      if (existingReceipt) {
        existingReceipts.push(lease.id)
        continue
      }

      // Créer la nouvelle quittance
      const receiptData = {
        lease_id: lease.id,
        tenant_id: lease.tenant_id,
        owner_id: lease.owner_id,
        property_id: lease.property_id,
        month: currentMonth,
        year: currentYear,
        rent_amount: lease.monthly_rent,
        charges_amount: lease.charges || 0,
        total_amount: lease.monthly_rent + (lease.charges || 0),
        status: "pending",
      }

      receiptsToCreate.push(receiptData)
    }

    // Insérer les nouvelles quittances
    let createdReceipts = []
    if (receiptsToCreate.length > 0) {
      const { data: newReceipts, error: insertError } = await supabase
        .from("rent_receipts")
        .insert(receiptsToCreate)
        .select("*")

      if (insertError) {
        console.error("❌ [GENERATE-RECEIPTS] Erreur insertion:", insertError)
        return NextResponse.json({ success: false, error: "Erreur création quittances" }, { status: 500 })
      }

      createdReceipts = newReceipts || []
    }

    console.log(`✅ [GENERATE-RECEIPTS] ${createdReceipts.length} nouvelles quittances créées`)
    console.log(`ℹ️ [GENERATE-RECEIPTS] ${existingReceipts.length} quittances existaient déjà`)

    return NextResponse.json({
      success: true,
      message: `${createdReceipts.length} quittances créées pour ${currentMonth}/${currentYear}`,
      created: createdReceipts.length,
      existing: existingReceipts.length,
      receipts: createdReceipts,
    })
  } catch (error) {
    console.error("❌ [GENERATE-RECEIPTS] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
