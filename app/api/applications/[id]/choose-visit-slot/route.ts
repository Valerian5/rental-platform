import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: applicationId } = params
    const { slot_id } = await request.json()

    console.log("📅 Choix créneau:", { applicationId, slot_id })

    // Vérifier que les paramètres sont valides
    if (!applicationId || !slot_id) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    // Récupérer la candidature avec les détails
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(*),
        tenant:users(*)
      `)
      .eq("id", applicationId)
      .single()

    if (appError) {
      console.error("❌ Erreur candidature:", appError)
      return NextResponse.json({ error: "Candidature non trouvée", details: appError.message }, { status: 404 })
    }

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que le statut est correct
    if (application.status !== "visit_proposed") {
      console.error("❌ Statut incorrect:", application.status)
      return NextResponse.json(
        { error: `Statut incorrect: ${application.status}. Attendu: visit_proposed` },
        { status: 400 },
      )
    }

    // Récupérer les détails du créneau choisi
    const { data: slot, error: slotError } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("id", slot_id)
      .single()

    if (slotError) {
      console.error("❌ Erreur créneau:", slotError)
      return NextResponse.json({ error: "Créneau non trouvé", details: slotError.message }, { status: 404 })
    }

    if (!slot) {
      return NextResponse.json({ error: "Créneau non trouvé" }, { status: 404 })
    }

    // Vérifier que le créneau est encore disponible
    if (slot.current_bookings >= slot.max_capacity) {
      console.error("❌ Créneau complet")
      return NextResponse.json({ error: "Ce créneau est maintenant complet" }, { status: 400 })
    }

    // Vérifier que le créneau appartient à la bonne propriété
    if (slot.property_id !== application.property_id) {
      console.error("❌ Créneau ne correspond pas à la propriété")
      return NextResponse.json({ error: "Créneau invalide pour cette propriété" }, { status: 400 })
    }

    // Préparer les données de la visite (compatible avec votre structure existante)
    const visitData = {
      property_id: application.property_id,
      tenant_id: application.tenant_id,
      // Utiliser visite_date si visit_date n'existe pas encore
      visite_date: slot.date,
      visit_date: slot.date, // Au cas où la colonne existe déjà
      status: "scheduled",
      notes: `Visite programmée suite à la candidature ${applicationId}. Créneau: ${slot.start_time} - ${slot.end_time}`,
      application_id: applicationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Ajouter les nouvelles colonnes si elles existent
    const visitorName = `${application.tenant?.first_name || ""} ${application.tenant?.last_name || ""}`.trim()
    if (visitorName) {
      visitData.visitor_name = visitorName
    }

    if (application.tenant?.email) {
      visitData.visitor_email = application.tenant.email
    }

    if (application.tenant?.phone) {
      visitData.visitor_phone = application.tenant.phone
    }

    if (slot.start_time) {
      visitData.start_time = slot.start_time
    }

    if (slot.end_time) {
      visitData.end_time = slot.end_time
    }

    console.log("📅 Données visite:", visitData)

    // Créer la visite avec gestion d'erreur pour colonnes manquantes
    const { data: visit, error: visitError } = await supabase.from("visits").insert(visitData).select().single()

    if (visitError) {
      console.error("❌ Erreur création visite:", visitError)

      // Si erreur de colonne manquante, essayer avec structure minimale
      if (visitError.message?.includes("does not exist")) {
        console.log("🔄 Tentative avec structure minimale...")

        const minimalVisitData = {
          property_id: application.property_id,
          tenant_id: application.tenant_id,
          visite_date: slot.date,
          status: "scheduled",
          notes: `Visite programmée suite à la candidature ${applicationId}. Créneau: ${slot.start_time} - ${slot.end_time}`,
          application_id: applicationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: minimalVisit, error: minimalError } = await supabase
          .from("visits")
          .insert(minimalVisitData)
          .select()
          .single()

        if (minimalError) {
          console.error("❌ Erreur création visite minimale:", minimalError)
          return NextResponse.json(
            {
              error: "Erreur lors de la création de la visite",
              details: minimalError.message,
              suggestion: "Veuillez exécuter le script de migration de la table visits",
            },
            { status: 500 },
          )
        }

        const visit = minimalVisit
      } else {
        return NextResponse.json(
          {
            error: "Erreur lors de la création de la visite",
            details: visitError.message,
            code: visitError.code,
          },
          { status: 500 },
        )
      }
    }

    if (!visit) {
      return NextResponse.json({ error: "Visite non créée" }, { status: 500 })
    }

    console.log("✅ Visite créée:", visit.id)

    // Mettre à jour le statut de la candidature
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "visit_scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      // On continue même si la mise à jour échoue car la visite est créée
    }

    // Mettre à jour le créneau pour indiquer qu'il est réservé
    const { error: slotUpdateError } = await supabase
      .from("property_visit_slots")
      .update({
        current_bookings: (slot.current_bookings || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slot_id)

    if (slotUpdateError) {
      console.error("❌ Erreur mise à jour créneau:", slotUpdateError)
      // On continue même si la mise à jour échoue
    }

    // Créer une notification pour le propriétaire
    try {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: application.property.owner_id,
        title: "Visite confirmée",
        content: `${application.tenant?.first_name || "Un locataire"} ${application.tenant?.last_name || ""} a confirmé une visite pour ${application.property.title}`,
        type: "visit_confirmed",
        action_url: "/owner/visits",
        created_at: new Date().toISOString(),
      })

      if (notifError) {
        console.error("❌ Erreur notification:", notifError)
      }
    } catch (notifError) {
      console.error("❌ Erreur notification:", notifError)
    }

    console.log("✅ Visite programmée avec succès")

    return NextResponse.json({
      success: true,
      visit: visit,
      message: "Créneau de visite confirmé avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur serveur complète:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
