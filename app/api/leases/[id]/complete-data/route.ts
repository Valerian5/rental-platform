import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { completedData } = await request.json()

    // Sauvegarder les données complétées dans le bail
    const { error } = await supabase
      .from("leases")
      .update({
        completed_data: completedData,
        data_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur sauvegarde données:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la sauvegarde" }, { status: 500 })
  }
}
