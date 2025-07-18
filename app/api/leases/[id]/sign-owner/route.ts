import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const body = await request.json()
    const { ownerId, signature } = body

    console.log("✍️ [SIGN-OWNER] Signature propriétaire pour bail:", leaseId)

    // Vérifier que le bail existe et appartient au propriétaire
    const { data: lease, error: leaseError } = await supabase.from("leases").select("*").eq("id", leaseId).single()

    if (leaseError || !lease) {
      console.error("❌ [SIGN-OWNER] Bail non trouvé:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    // Déterminer le nouveau statut
    let newStatus = "signed_by_owner"
    if (lease.signed_by_tenant) {
      newStatus = "active" // Les deux ont signé
    }

    // Mettre à jour la signature du propriétaire
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        signed_by_owner: true,
        owner_signature_date: new Date().toISOString(),
        owner_signature: signature || "Signature électronique simple",
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId)

    if (updateError) {
      console.error("❌ [SIGN-OWNER] Erreur signature:", updateError)
      return NextResponse.json({ success: false, error: "Erreur lors de la signature" }, { status: 500 })
    }

    console.log("✅ [SIGN-OWNER] Bail signé par le propriétaire")

    return NextResponse.json({
      success: true,
      message: "Bail signé avec succès",
      status: newStatus,
    })
  } catch (error) {
    console.error("❌ [SIGN-OWNER] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
