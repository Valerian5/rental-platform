import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { 
  sendApplicationReceivedEmail, 
  sendNewApplicationNotificationToOwner,
  sendApplicationStatusUpdateEmail 
} from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { application_id, tenant_id, property_id, type, status, notes } = await request.json()

    if (!tenant_id || !property_id || !type) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const server = createServerClient()

    // Récupérer les données nécessaires
    const { data: property } = await server
      .from("properties")
      .select("id, title, address, owner_id")
      .eq("id", property_id)
      .single()

    const { data: tenant } = await server
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("id", tenant_id)
      .single()

    const { data: owner } = property?.owner_id
      ? await server
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("id", property.owner_id)
          .single()
      : { data: null }

    // Gestion des nouvelles candidatures
    if (type === "new_application" && tenant && owner && property) {
      try {
        // Email au locataire
        await sendApplicationReceivedEmail(
          { id: tenant.id, name: `${tenant.first_name} ${tenant.last_name}`, email: tenant.email },
          { id: property.id, title: property.title, address: property.address }
        )

        // Email au propriétaire
        await sendNewApplicationNotificationToOwner(
          { id: owner.id, name: `${owner.first_name} ${owner.last_name}`, email: owner.email },
          { id: tenant.id, name: `${tenant.first_name} ${tenant.last_name}`, email: tenant.email },
          { id: property.id, title: property.title, address: property.address }
        )

        console.log("✅ Emails envoyés pour nouvelle candidature")
      } catch (emailError) {
        console.error("❌ Erreur envoi emails nouvelle candidature:", emailError)
        return NextResponse.json({ error: "Erreur envoi emails" }, { status: 500 })
      }
    }

    // Gestion des mises à jour de statut
    if (type === "status_update" && tenant && property && status) {
      try {
        // Email au locataire pour la mise à jour de statut
        await sendApplicationStatusUpdateEmail(
          { id: tenant.id, name: `${tenant.first_name} ${tenant.last_name}`, email: tenant.email },
          { id: property.id, title: property.title, address: property.address },
          status
        )

        console.log(`✅ Email de mise à jour de statut envoyé au locataire: ${status}`)
      } catch (emailError) {
        console.error("❌ Erreur envoi email mise à jour statut:", emailError)
        return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur API send-notification:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
