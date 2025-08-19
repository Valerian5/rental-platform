import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { docuSignService } from "@/lib/docusign-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id

    console.log("📤 [SEND-DOCUSIGN] Envoi du bail pour signature DocuSign:", leaseId)

    // Vérifier que le bail existe et a un document généré
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(title, address, city),
        tenant:users!tenant_id(first_name, last_name, email),
        owner:users!owner_id(first_name, last_name, email)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      console.error("❌ [SEND-DOCUSIGN] Bail non trouvé:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    if (!lease.generated_document) {
      return NextResponse.json(
        {
          success: false,
          error: "Le document doit être généré avant l'envoi pour signature",
        },
        { status: 400 },
      )
    }

    if (lease.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error: "Le bail a déjà été envoyé pour signature",
        },
        { status: 400 },
      )
    }

    // Envoyer via DocuSign
    const result = await docuSignService.sendLeaseForSignature(
      leaseId,
      lease.generated_document,
      lease.owner.email,
      `${lease.owner.first_name} ${lease.owner.last_name}`,
      lease.tenant.email,
      `${lease.tenant.first_name} ${lease.tenant.last_name}`,
    )

    console.log("✅ [SEND-DOCUSIGN] Bail envoyé via DocuSign")

    return NextResponse.json({
      success: true,
      message: "Bail envoyé pour signature via DocuSign",
      envelopeId: result.envelopeId,
      signingUrls: result.signingUrls,
    })
  } catch (error) {
    console.error("❌ [SEND-DOCUSIGN] Erreur:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur serveur",
      },
      { status: 500 },
    )
  }
}
