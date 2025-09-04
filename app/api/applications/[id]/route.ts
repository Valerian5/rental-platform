import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { sendApplicationStatusUpdateEmail } from "@/lib/email-service"
import { notificationsService } from "@/lib/notifications-service"
import { sendWaitingTenantConfirmationEmailToTenant } from "@/lib/email-service"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

export const dynamic = "force-dynamic"

// GET - Récupérer une candidature spécifique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const applicationId = params.id

    console.log("🔍 Chargement détails candidature:", applicationId)

    // 1. Récupère la candidature
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(*),
        tenant:users(*)
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Erreur récupération candidature:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // 2. Récupère le dossier rental_file du tenant
    let rentalFile = null
    if (application.tenant_id) {
      const { data: rf, error: rfError } = await supabase
        .from("rental_files")
        .select("id, main_tenant, cotenants")
        .eq("tenant_id", application.tenant_id)
        .single()
      if (!rfError && rf) rentalFile = rf
    }

    // 3. Récupère les visites liées (incluant les feedbacks)
    let visits = [] as any[]
    try {
      const { data: visitsData, error: visitsError } = await supabase
        .from("visits")
        .select("*")
        .eq("tenant_id", application.tenant_id)
        .eq("property_id", application.property_id)
        .order("visit_date", { ascending: false })

      if (visitsError) {
        console.error("❌ Erreur récupération visites pour application:", visitsError)
      } else if (visitsData) {
        visits = visitsData
      }
    } catch (err) {
      console.error("❌ Exception récupération visites:", err)
    }

    // 4. Renvoie tout
    return NextResponse.json({ application: { ...application, rental_file: rentalFile, visits } })
  } catch (error) {
    console.error("❌ Erreur API applications/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une candidature (retirer la candidature)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const applicationId = params.id

  try {
    console.log("🗑️ Suppression candidature:", applicationId)

    // D'abord, récupérer la candidature pour vérifier qu'elle existe
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("id", applicationId)
      .single()

    if (fetchError || !application) {
      console.error("❌ Candidature non trouvée:", fetchError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier si la candidature peut être supprimée
    if (application.status === "withdrawn") {
      return NextResponse.json({ error: "Cette candidature a déjà été retirée" }, { status: 400 })
    }

    // Récupérer les visites associées pour libérer les créneaux
    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select("id, notes")
      .eq("application_id", applicationId)
      .eq("status", "scheduled")

    if (visitsError) {
      console.error("❌ Erreur récupération visites:", visitsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des visites" }, { status: 500 })
    }

    // Libérer les créneaux de visite si nécessaire
    if (visits && visits.length > 0) {
      console.log("🔄 Libération de", visits.length, "créneaux de visite...")

      for (const visit of visits) {
        // Extraire l'ID du créneau depuis les notes (format: "Créneau sélectionné: {slot_id}")
        const slotIdMatch = visit.notes?.match(/Créneau sélectionné: (.+)/)
        if (slotIdMatch && slotIdMatch[1]) {
          const slotId = slotIdMatch[1]

          // Utiliser la fonction SQL pour décrémenter les réservations
          const { error: decrementError } = await supabase.rpc("decrement_slot_bookings", {
            slot_id: slotId,
          })

          if (decrementError) {
            console.error("❌ Erreur libération créneau:", slotId, decrementError)
          } else {
            console.log("✅ Créneau libéré:", slotId)
          }
        }
      }

      // Supprimer les visites
      const { error: deleteVisitsError } = await supabase.from("visits").delete().eq("application_id", applicationId)

      if (deleteVisitsError) {
        console.error("❌ Erreur suppression visites:", deleteVisitsError)
        return NextResponse.json({ error: "Erreur lors de la suppression des visites" }, { status: 500 })
      }
    }

    // Marquer la candidature comme withdrawn au lieu de la supprimer
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      return NextResponse.json({ error: "Erreur lors du retrait de la candidature" }, { status: 500 })
    }

    console.log("✅ Candidature retirée avec succès:", applicationId)

    return NextResponse.json({
      success: true,
      message: "Candidature retirée avec succès",
      application_id: applicationId,
      visits_removed: visits?.length || 0,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

// PATCH - Mettre à jour une candidature
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const applicationId = params.id
    const body = await request.json()

    console.log("🔄 Mise à jour candidature:", applicationId, body)

    const statusToUpdate = body.status
    if (statusToUpdate === "accepted" || statusToUpdate === "approved") {
      body.status = "waiting_tenant_confirmation"
      console.log(`✅ Statut modifié de '${statusToUpdate}' à 'waiting_tenant_confirmation'`)
    }

    // Mettre à jour la candidature
    const { data, error } = await supabase
      .from("applications")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select(`
        *,
        tenant:users!applications_tenant_id_fkey(*),
        property:properties(*, owner:users(*, agency:agencies(*)))
      `)
      .single()

    if (error) {
      console.error("❌ Erreur mise à jour candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // AJOUT DES NOTIFICATIONS SANS TOUCHER AU RESTE
    if (body.status && data.tenant && data.property) {
      let notificationTitle = ""
      let notificationContent = ""
      let notificationType = "application_update"

      switch (body.status) {
        case "analyzing":
          notificationTitle = "Votre dossier est en cours d'analyse"
          notificationContent = `Bonne nouvelle ! Le propriétaire a commencé à examiner votre candidature pour le bien "${data.property.title}".`
          break
        case "waiting_tenant_confirmation":
          notificationTitle = "Votre dossier a été accepté !"
          notificationContent = `Félicitations ! Le propriétaire a accepté votre dossier pour "${data.property.title}". Confirmez votre choix dès maintenant.`
          notificationType = "application_accepted"
          break
        case "rejected":
          notificationTitle = "Votre candidature n'a pas été retenue"
          notificationContent = `Malheureusement, votre candidature pour le bien "${data.property.title}" a été refusée.`
          notificationType = "application_rejected"
          break
      }

      if (notificationTitle) {
        try {
            await notificationsService.createNotification(data.tenant.id, {
                title: notificationTitle,
                content: notificationContent,
                type: notificationType,
                action_url: `/tenant/applications`,
            })
            console.log(`✅ Notification envoyée au locataire pour le statut : ${body.status}`)
        } catch (notificationError) {
            console.error("❌ Erreur envoi notification:", notificationError)
        }
      }
    }

    // Envoi email au locataire pour les statuts importants
    if (
      body.status &&
      data.tenant &&
      data.property &&
      ["en analyse", "acceptée", "refusée", "withdrawn", "in_review", "accepted", "rejected"].includes(body.status)
    ) {
      try {
        const logoUrl = data.property.owner?.agency?.logo_url ?? undefined
        await sendApplicationStatusUpdateEmail(
          {
            id: data.tenant.id,
            name: `${data.tenant.first_name} ${data.tenant.last_name}`,
            email: data.tenant.email,
          },
          data.property,
          body.status,
          logoUrl
        )
      } catch (emailError) {
        console.error("❌ Erreur envoi email statut candidature:", emailError)
      }
    }

    // Envoi de l'email pour demander la confirmation au locataire si on est passé en waiting_tenant_confirmation
    if (body.status === "waiting_tenant_confirmation" && data.tenant && data.property) {
      try {
        const logoUrl = data.property.owner?.agency?.logo_url ?? undefined
        const ownerName =
          data.property.owner ? `${data.property.owner.first_name} ${data.property.owner.last_name}` : undefined
        const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/applications` // vers l’encart de confirmation

        await sendWaitingTenantConfirmationEmailToTenant(
          {
            id: data.tenant.id,
            name: `${data.tenant.first_name} ${data.tenant.last_name}`,
            email: data.tenant.email,
          },
          {
            id: data.property.id,
            title: data.property.title,
            address: data.property.address,
          },
          confirmUrl,
          ownerName,
          logoUrl
        )
        console.log("✅ Email de demande de confirmation envoyé au locataire")
      } catch (emailError) {
        console.error("❌ Erreur envoi email demande de confirmation:", emailError)
      }
    }

    console.log("✅ Candidature mise à jour")
    return NextResponse.json({ application: data })
  } catch (error) {
    console.error("❌ Erreur PATCH applications/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}