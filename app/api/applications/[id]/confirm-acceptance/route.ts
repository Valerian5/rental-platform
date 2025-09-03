import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { notificationsService } from "@/lib/notifications-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("✅ Traitement de la décision du locataire pour la candidature:", params.id)

    const { confirmed } = await request.json()

    if (confirmed) {
      // Le locataire confirme -> Mettre à jour le statut vers "confirmed_by_tenant"
      const { error } = await supabase
        .from("applications")
        .update({
          status: "confirmed_by_tenant", // STATUT CORRIGÉ
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      // ... la logique de notification reste la même ...

      console.log("✅ Candidature confirmée par le locataire")
    } else {
      // Le locataire refuse -> Mettre à jour le statut vers "rejected"
      const { error } = await supabase
        .from("applications")
        .update({
          status: "rejected", // STATUT CORRIGÉ
          rejection_reason: "Refusé par le locataire après acceptation du dossier.", // Ajout d'un motif
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      console.log("❌ Candidature refusée par le locataire")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur lors du traitement de la décision du locataire:", error)
    return NextResponse.json({ success: false, error: "Erreur lors du traitement de la décision" }, { status: 500 })
  }
}