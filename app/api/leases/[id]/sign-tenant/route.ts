import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const body = await request.json()
    const { tenantId, signature } = body

    console.log("✍️ [SIGN-TENANT] Signature locataire pour bail:", leaseId)

    // Vérifier que le bail existe et appartient au locataire
    const { data: lease, error: leaseError } = await supabase.from("leases").select("*").eq("id", leaseId).single()

    if (leaseError || !lease) {
      console.error("❌ [SIGN-TENANT] Bail non trouvé:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    if (lease.status !== "sent_to_tenant") {
      return NextResponse.json({ success: false, error: "Le bail n'est pas prêt à être signé" }, { status: 400 })
    }

    // Mettre à jour la signature du locataire
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        signed_by_tenant: true,
        tenant_signature_date: new Date().toISOString(),
        tenant_signature: signature || "Signature électronique simple",
        status: "signed_by_tenant",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId)

    if (updateError) {
      console.error("❌ [SIGN-TENANT] Erreur signature:", updateError)
      return NextResponse.json({ success: false, error: "Erreur lors de la signature" }, { status: 500 })
    }

    console.log("✅ [SIGN-TENANT] Bail signé par le locataire")

    return NextResponse.json({
      success: true,
      message: "Bail signé avec succès",
    })
  } catch (error) {
    console.error("❌ [SIGN-TENANT] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
