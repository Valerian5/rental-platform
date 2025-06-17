import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("💾 Sauvegarde données complétées pour bail:", params.id)

    const { completedData } = await request.json()

    // Sauvegarder les données complétées
    const { error } = await supabase
      .from("leases")
      .update({
        completed_data: completedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (error) throw error

    console.log("✅ Données sauvegardées")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur sauvegarde:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la sauvegarde" }, { status: 500 })
  }
}
