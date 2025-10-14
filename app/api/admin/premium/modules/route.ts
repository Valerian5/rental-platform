import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: modules, error } = await supabase.from("premium_modules").select("id,name,display_name,description,category,is_active")
    if (error) throw error
    return NextResponse.json({ success: true, modules })
  } catch (e) {
    console.error("❌ Erreur GET premium_modules:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}


