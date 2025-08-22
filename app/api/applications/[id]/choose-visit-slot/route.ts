import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const applicationId = params.id;
    const { slot_id } = await request.json();

    if (!slot_id) {
      return NextResponse.json(
        { error: "slot_id requis" },
        { status: 400 }
      );
    }

    console.log("📅 Sélection créneau:", slot_id, "pour application:", applicationId);

    // Vérifier si la candidature existe
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("❌ Application introuvable:", appError);
      return NextResponse.json(
        { error: "Candidature introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si un créneau est déjà réservé pour cette candidature
    const { data: existingVisit, error: existingError } = await supabase
      .from("visits")
      .select("id, notes")
      .eq("application_id", applicationId)
      .eq("status", "scheduled")
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("❌ Erreur récupération visite:", existingError);
      return NextResponse.json(
        { error: "Erreur récupération visite" },
        { status: 500 }
      );
    }

    if (existingVisit) {
      return NextResponse.json(
        { error: "Un créneau est déjà réservé pour cette candidature" },
        { status: 400 }
      );
    }

    // Créer la visite
    const { data: visit, error: insertError } = await supabase
      .from("visits")
      .insert({
        application_id: applicationId,
        status: "scheduled",
        notes: `Créneau sélectionné: ${slot_id}`,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("❌ Erreur insertion visite:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    // Incrémenter le compteur du créneau
    const { error: incrementError } = await supabase.rpc(
      "increment_slot_bookings",
      { slot_id }
    );

    if (incrementError) {
      console.error("⚠️ Erreur incrément compteur:", incrementError);

      // rollback : supprimer la visite si incrément échoue
      await supabase.from("visits").delete().eq("id", visit.id);

      return NextResponse.json(
        { error: "Impossible de réserver le créneau, il est peut-être complet" },
        { status: 400 }
      );
    }

    console.log("✅ Créneau réservé avec succès:", slot_id);

    return NextResponse.json({ success: true, visit });
  } catch (err) {
    console.error("❌ Erreur choose-visit-slot:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
