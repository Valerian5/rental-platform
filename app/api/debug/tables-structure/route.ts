import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get("table")

    if (!table) {
      return NextResponse.json({ error: "Le paramètre 'table' est requis" }, { status: 400 })
    }

    // Récupérer la structure de la table
    const { data, error } = await supabase.from(table).select("*").limit(1)

    if (error) {
      console.error(`❌ Erreur récupération structure table ${table}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Récupérer le nombre total d'enregistrements
    const { count, error: countError } = await supabase.from(table).select("*", { count: "exact", head: true })

    if (countError) {
      console.error(`❌ Erreur comptage table ${table}:`, countError)
    }

    // Construire la structure
    const structure = {
      table,
      count: count || 0,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [],
      sample: data && data.length > 0 ? data[0] : null,
    }

    return NextResponse.json(structure)
  } catch (error) {
    console.error("❌ Erreur API debug tables:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur inconnue" }, { status: 500 })
  }
}
