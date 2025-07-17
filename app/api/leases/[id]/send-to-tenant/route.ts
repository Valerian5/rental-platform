import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id

    console.log("📤 [SEND-TO-TENANT] Envoi du bail au locataire:", leaseId)

    // Vérifier que le bail existe et a un document généré
    const { data: lease, error: leaseError } = await supabase.from("leases").select("*").eq("id", leaseId).single()

    if (leaseError || !lease) {
      console.error("❌ [SEND-TO-TENANT] Bail non trouvé:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    if (!lease.generated_document) {
      return NextResponse.json(
        {
          success: false,
          error: "Le document doit être généré avant l'envoi",
        },
        { status: 400 },
      )
    }

    if (lease.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error: "Le bail a déjà été envoyé",
        },
        { status: 400 },
      )
    }

    // Mettre à jour le statut du bail
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        status: "sent_to_tenant",
        sent_to_tenant_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId)

    if (updateError) {
      console.error("❌ [SEND-TO-TENANT] Erreur mise à jour:", updateError)
      return NextResponse.json({ success: false, error: "Erreur lors de l'envoi" }, { status: 500 })
    }

    console.log("✅ [SEND-TO-TENANT] Bail envoyé avec succès")

    return NextResponse.json({
      success: true,
      message: "Bail envoyé au locataire avec succès",
    })
  } catch (error) {
    console.error("❌ [SEND-TO-TENANT] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
