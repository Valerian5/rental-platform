import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendApplicationStatusUpdateEmail } from "@/lib/email-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

export const dynamic = "force-dynamic";

// POST - Choisir un créneau de visite
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const applicationId = params.id;
    const { slot_id } = await request.json();

    console.log("📅 Réservation créneau:", applicationId, slot_id);

    // 1. Récupérer la candidature
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(
        `
        *,
        tenant:users(*),
        property:properties(*, agency:agencies(logo_url))
      `
      )
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("❌ Erreur récupération candidature:", appError);
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 }
      );
    }

    // 2. Vérifier que le créneau existe et a encore de la place
    const { data: slot, error: slotError } = await supabase
      .from("visit_slots")
      .select("*")
      .eq("id", slot_id)
      .single();

    if (slotError || !slot) {
      console.error("❌ Créneau introuvable:", slotError);
      return NextResponse.json(
        { error: "Créneau introuvable" },
        { status: 404 }
      );
    }

    if (slot.current_bookings >= slot.max_bookings) {
      return NextResponse.json(
        { error: "Ce créneau est complet" },
        { status: 400 }
      );
    }

    // 3. Créer la visite (⚠️ ajouter property_id obligatoire)
    const { data: visit, error: insertError } = await supabase
      .from("visits")
      .insert({
        application_id: applicationId,
        property_id: application.property_id, // ✅ fixé ici
        status: "scheduled",
        notes: `Créneau sélectionné: ${slot_id}`,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("❌ Erreur insertion visite:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la réservation" },
        { status: 500 }
      );
    }

    // 4. Incrémenter le nombre de réservations sur le créneau
    const { error: incrementError } = await supabase.rpc(
      "increment_slot_bookings",
      { slot_id }
    );

    if (incrementError) {
      console.error("❌ Erreur incrémentation créneau:", incrementError);
    }

    // 5. Notifier par email (locataire + propriétaire)
    if (application.tenant && application.property) {
      const logoUrl = application.property.agency?.logo_url ?? undefined;

      // Email au locataire
      await sendApplicationStatusUpdateEmail(
        application.tenant,
        application.property,
        "Votre visite a été planifiée",
        logoUrl
      ).catch(console.error);

      // Email au propriétaire
      if (application.property.owner_id) {
        const { data: owner } = await supabase
          .from("users")
          .select("*")
          .eq("id", application.property.owner_id)
          .single();

        if (owner) {
          await sendApplicationStatusUpdateEmail(
            owner,
            application.property,
            "Un locataire a réservé un créneau de visite",
            logoUrl
          ).catch(console.error);
        }
      }
    }

    console.log("✅ Créneau réservé avec succès:", visit.id);

    return NextResponse.json({ success: true, visit });
  } catch (error) {
    console.error("❌ Erreur API choose-visit-slot:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
