import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { docuSignService } from "@/lib/docusign-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id

    console.log("📤 [SEND-DOCUSIGN] Envoi du bail pour signature DocuSign:", leaseId)

    const db = createServerClient()

    // Vérifier que le bail existe et a un document généré (bypass RLS via service role)
    const { data: lease, error: leaseError } = await db
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

    if (lease.status !== "draft" && lease.status !== "sent_to_tenant") {
      return NextResponse.json(
        {
          success: false,
          error: "Le bail a déjà été envoyé pour signature",
        },
        { status: 400 },
      )
    }

    // Envoyer via DocuSign
    console.log("📤 [SEND-DOCUSIGN] Données du bail:", {
      leaseId,
      ownerEmail: lease.owner.email,
      ownerName: `${lease.owner.first_name} ${lease.owner.last_name}`,
      tenantEmail: lease.tenant.email,
      tenantName: `${lease.tenant.first_name} ${lease.tenant.last_name}`,
      hasDocument: !!lease.generated_document
    })

    const result = await docuSignService.sendLeaseForSignature(
      leaseId,
      lease.generated_document,
      lease.owner.email,
      `${lease.owner.first_name} ${lease.owner.last_name}`,
      lease.tenant.email,
      `${lease.tenant.first_name} ${lease.tenant.last_name}`,
    )

    console.log("✅ [SEND-DOCUSIGN] Résultat DocuSign:", result)

    // Mettre à jour le statut du bail (ne pas stocker d'URLs de signature éphémères)
	const { error: updateError } = await db
	  .from("leases")
	  .update({
		status: "sent_to_tenant",
		docusign_envelope_id: result.envelopeId,
		docusign_status: "sent",
		sent_to_tenant_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	  })
	  .eq("id", leaseId)

    if (updateError) {
      console.error("❌ [SEND-DOCUSIGN] Erreur mise à jour statut:", updateError)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour du statut",
        },
        { status: 500 },
      )
    }

    console.log("✅ [SEND-DOCUSIGN] Statut mis à jour vers sent_to_tenant")

    return NextResponse.json({
      success: true,
      message: "Bail envoyé pour signature via DocuSign",
      envelopeId: result.envelopeId,
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