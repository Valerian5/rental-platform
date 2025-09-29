import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server-client"
import { NotificationsService } from "@/lib/notifications-service"
import { sendLeaseOwnerFinalizedEmail, sendLeaseTenantFinalizedEmail } from "@/lib/email-service"
import xml2js from "xml2js"

// Configuration du parser XML
const parser = new xml2js.Parser({ explicitArray: false })

const processedEnvelopes = new Map<string, number>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Gère les notifications webhook de Docusign.
 * Cette fonction est appelée par Docusign à chaque changement de statut d'une enveloppe.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const supabase = createClient()

    // Parse le corps de la requête XML en objet JavaScript
    const result = await parser.parseStringPromise(rawBody)

    const envelopeStatus = result.DocuSignEnvelopeInformation.EnvelopeStatus
    const envelopeId = envelopeStatus.EnvelopeID
    const status = envelopeStatus.Status

    const now = Date.now()
    const lastProcessed = processedEnvelopes.get(envelopeId)
    if (lastProcessed && now - lastProcessed < CACHE_DURATION) {
      console.log(`⏭️ Enveloppe ${envelopeId} déjà traitée récemment, ignorée`)
      return NextResponse.json({ status: "ok", message: "Already processed" })
    }

    // Trouve le bail correspondant à l'enveloppe Docusign
    const { data: lease, error: fetchError } = await supabase
      .from("leases")
      .select("id, signatures_detail, agency_id")
      .eq("docusign_envelope_id", envelopeId)
      .single()

    if (fetchError || !lease) {
      console.error("Bail non trouvé pour envelopeId:", envelopeId, fetchError)
      return NextResponse.json({ status: "error", message: "Lease not found" }, { status: 404 })
    }

    // Extrait et formate les statuts de chaque signataire
    const recipientStatuses = envelopeStatus.RecipientStatuses.RecipientStatus
    const signaturesDetail = Array.isArray(recipientStatuses)
      ? recipientStatuses.map((recipient: any) => ({
          name: recipient.UserName,
          email: recipient.Email,
          status: recipient.Status,
          signedDate: recipient.Signed,
          deliveredDate: recipient.Delivered,
        }))
      : [
          {
            // Gère le cas où il n'y a qu'un seul signataire
            name: recipientStatuses.UserName,
            email: recipientStatuses.Email,
            status: recipientStatuses.Status,
            signedDate: recipientStatuses.Signed,
            deliveredDate: recipientStatuses.Delivered,
          },
        ]

    // Met à jour la table 'leases' avec le nouveau statut et les détails de signature
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        docusign_status: status,
        signatures_detail: signaturesDetail,
        // Si le statut est "Completed", on enregistre la date de complétion
        ...(status === "Completed" && { docusign_completed_at: new Date().toISOString(), status: "active" }),
      })
      .eq("docusign_envelope_id", envelopeId)

    if (updateError) {
      console.error("Erreur lors de la mise à jour du bail:", updateError)
      throw updateError
    }

    if (["Sent", "Delivered", "Completed", "Declined"].includes(status)) {
      try {
        await NotificationsService.sendDocusignStatusUpdate(lease.id, status, signaturesDetail)
        console.log(`📧 Notification envoyée pour bail ${lease.id}, statut: ${status}`)
      } catch (emailError) {
        console.error("❌ Erreur envoi notification email:", emailError)
        // Ne pas faire échouer le webhook si l'email échoue
      }
    }

    // Emails de finalisation si Completed
    if (status === "Completed") {
      try {
        // Récupérer infos minimales pour emails (propriété, emails) si disponibles
        const { data: fullLease } = await supabase
          .from("leases")
          .select("id, owner:users!owner_id(email, first_name, last_name), tenant:users!tenant_id(email, first_name, last_name), property:properties(id, title, address)")
          .eq("docusign_envelope_id", envelopeId)
          .single()

        if (fullLease?.owner?.email && fullLease?.tenant?.email) {
          const property = { id: fullLease.property?.id || "", title: fullLease.property?.title || "", address: fullLease.property?.address || "" }
          await Promise.all([
            sendLeaseOwnerFinalizedEmail({ email: fullLease.owner.email, name: `${fullLease.owner.first_name} ${fullLease.owner.last_name}` }, property as any, fullLease.id),
            sendLeaseTenantFinalizedEmail({ email: fullLease.tenant.email, name: `${fullLease.tenant.first_name} ${fullLease.tenant.last_name}` }, property as any, fullLease.id),
          ])
        }
      } catch (e) {
        console.warn("⚠️ Erreur envoi emails finalized:", e)
      }
    }

    processedEnvelopes.set(envelopeId, now)

    if (processedEnvelopes.size > 1000) {
      for (const [id, timestamp] of processedEnvelopes.entries()) {
        if (now - timestamp > CACHE_DURATION) {
          processedEnvelopes.delete(id)
        }
      }
    }

    console.log(`✅ Statut du bail ${lease.id} mis à jour à ${status}`)
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Erreur lors du traitement du webhook Docusign:", error)
    return NextResponse.json({ status: "error", message: "Internal Server Error" }, { status: 500 })
  }
}
