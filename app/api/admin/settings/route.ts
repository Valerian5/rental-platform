import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    console.log("🔍 API Settings - Récupération paramètre:", key)

    if (!key) {
      // Récupérer tous les paramètres
      const { data, error } = await supabase.from("site_settings").select("*")

      if (error) {
        console.error("❌ Erreur récupération tous paramètres:", error)
        return NextResponse.json({ success: false, error: error.message })
      }

      console.log("✅ Tous paramètres récupérés:", data)
      return NextResponse.json({ success: true, data })
    }

    // Récupérer un paramètre spécifique
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).single()

    if (error) {
      console.error(`❌ Erreur récupération paramètre ${key}:`, error)
      return NextResponse.json({ success: false, error: error.message })
    }

    console.log(`✅ Paramètre ${key} récupéré:`, data)

    // Parser la valeur JSON si c'est un objet
    let parsedValue = data.value
    if (typeof data.value === "string") {
      try {
        parsedValue = JSON.parse(data.value)
      } catch (e) {
        // Si ce n'est pas du JSON, garder la valeur string
        parsedValue = data.value
      }
    }

    return NextResponse.json({ success: true, data: parsedValue })
  } catch (error) {
    console.error("❌ Erreur API Settings:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    console.log("💾 API Settings - Sauvegarde:", { key, value })

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Clé et valeur requises" })
    }

    // Convertir en JSON si c'est un objet
    const jsonValue = typeof value === "object" ? JSON.stringify(value) : value

    const { data, error } = await supabase.from("site_settings").upsert({ key, value: jsonValue }).select()

    if (error) {
      console.error("❌ Erreur sauvegarde paramètre:", error)
      return NextResponse.json({ success: false, error: error.message })
    }

    console.log("✅ Paramètre sauvegardé:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ Erreur API Settings POST:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" })
  }
}
