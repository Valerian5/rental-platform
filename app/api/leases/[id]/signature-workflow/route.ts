import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { notificationsService } from "@/lib/notifications-service"
import { sendSignatureRequiredEmail, sendSignatureCompletedEmail, sendLeaseFullySignedEmail } from "@/lib/email-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const body = await request.json()
    const { action, signatureMethod, signatureData, userType } = body

    console.log("🔄 [SIGNATURE-WORKFLOW] Action:", action, "pour bail:", leaseId)

    const server = createServerClient()

    // Récupérer le bail avec les informations de propriété
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select(`
        *,
        property:properties(*),
        owner:users!leases_owner_id_fkey(*),
        tenant:users!leases_tenant_id_fkey(*)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      console.error("❌ [SIGNATURE-WORKFLOW] Bail non trouvé:", leaseError)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    let newStatus = lease.status
    let updateData: any = {}

    switch (action) {
      case "initiate_signature":
        // L'owner initie le processus de signature
        if (userType !== "owner") {
          return NextResponse.json({ error: "Seul le propriétaire peut initier la signature" }, { status: 403 })
        }

        newStatus = "ready_for_signature"
        updateData = {
          status: newStatus,
          signature_method: signatureMethod,
          updated_at: new Date().toISOString(),
        }

        // Notifier le tenant
        await notificationsService.notifySignatureRequired(
          leaseId,
          "tenant",
          signatureMethod,
          lease,
          lease.property
        )

        // Envoyer email au tenant
        if (lease.tenant) {
          const tenantUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tenant/leases/${leaseId}`
          await sendSignatureRequiredEmail(
            lease.tenant,
            lease.property,
            signatureMethod,
            tenantUrl
          )
        }
        break

      case "sign_electronically":
        if (userType === "owner") {
          updateData = {
            signed_by_owner: true,
            owner_signature_date: new Date().toISOString(),
            owner_signature: signatureData || "Signature électronique",
            status: lease.signed_by_tenant ? "active" : "owner_signed_electronically",
            updated_at: new Date().toISOString(),
          }
          newStatus = updateData.status

          // Notifier le tenant
          await notificationsService.notifySignatureCompleted(
            leaseId,
            "owner",
            lease,
            lease.property
          )

          if (lease.tenant) {
            const tenantUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tenant/leases/${leaseId}`
            await sendSignatureCompletedEmail(
              lease.tenant,
              lease.property,
              "owner",
              tenantUrl
            )
          }
        } else if (userType === "tenant") {
          updateData = {
            signed_by_tenant: true,
            tenant_signature_date: new Date().toISOString(),
            tenant_signature: signatureData || "Signature électronique",
            status: lease.signed_by_owner ? "active" : "tenant_signed_electronically",
            updated_at: new Date().toISOString(),
          }
          newStatus = updateData.status

          // Notifier l'owner
          await notificationsService.notifySignatureCompleted(
            leaseId,
            "tenant",
            lease,
            lease.property
          )

          if (lease.owner) {
            const ownerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/owner/leases/${leaseId}`
            await sendSignatureCompletedEmail(
              lease.owner,
              lease.property,
              "tenant",
              ownerUrl
            )
          }
        }
        break

      case "upload_manual_signature":
        // Gérer l'upload de signature manuelle
        if (userType === "owner") {
          updateData = {
            signed_by_owner: true,
            owner_signature_date: new Date().toISOString(),
            owner_signature: "Signature manuelle",
            status: lease.signed_by_tenant ? "active" : "owner_signed_manually",
            updated_at: new Date().toISOString(),
          }
          newStatus = updateData.status

          // Notifier le tenant
          await notificationsService.notifySignatureCompleted(
            leaseId,
            "owner",
            lease,
            lease.property
          )

          if (lease.tenant) {
            const tenantUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tenant/leases/${leaseId}`
            await sendSignatureCompletedEmail(
              lease.tenant,
              lease.property,
              "owner",
              tenantUrl
            )
          }
        } else if (userType === "tenant") {
          updateData = {
            signed_by_tenant: true,
            tenant_signature_date: new Date().toISOString(),
            tenant_signature: "Signature manuelle",
            status: lease.signed_by_owner ? "active" : "tenant_signed_manually",
            updated_at: new Date().toISOString(),
          }
          newStatus = updateData.status

          // Notifier l'owner
          await notificationsService.notifySignatureCompleted(
            leaseId,
            "tenant",
            lease,
            lease.property
          )

          if (lease.owner) {
            const ownerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/owner/leases/${leaseId}`
            await sendSignatureCompletedEmail(
              lease.owner,
              lease.property,
              "tenant",
              ownerUrl
            )
          }
        }
        break

      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
    }

    // Mettre à jour le bail
    const { error: updateError } = await server
      .from("leases")
      .update(updateData)
      .eq("id", leaseId)

    if (updateError) {
      console.error("❌ [SIGNATURE-WORKFLOW] Erreur mise à jour:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    // Si le bail est entièrement signé, notifier les deux parties
    if (newStatus === "active") {
      await notificationsService.notifyFullySigned(leaseId, lease, lease.property)

      // Envoyer emails aux deux parties
      const leaseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${userType}/leases/${leaseId}`
      if (lease.owner) {
        await sendLeaseFullySignedEmail(lease.owner, lease.property, leaseUrl)
      }
      if (lease.tenant) {
        await sendLeaseFullySignedEmail(lease.tenant, lease.property, leaseUrl)
      }
    }

    console.log("✅ [SIGNATURE-WORKFLOW] Action terminée, nouveau statut:", newStatus)

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: "Action effectuée avec succès",
    })
  } catch (error) {
    console.error("❌ [SIGNATURE-WORKFLOW] Erreur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
