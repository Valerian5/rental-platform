import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Upsert des associations plan_modules (is_included, usage_limit)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { modules } = await request.json()
    if (!Array.isArray(modules)) return NextResponse.json({ success: false, error: "modules[] requis" }, { status: 400 })

    // Nettoyage / insertion simple: on peut delete puis insert
    await supabase.from("plan_modules").delete().eq("plan_id", params.id)

    const payload = modules.map((m: any) => ({
      plan_id: params.id,
      module_id: m.id,
      is_included: !!m.is_included,
      usage_limit: m.usage_limit ?? null,
    }))

    const { error } = await supabase.from("plan_modules").insert(payload)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("❌ Erreur update plan modules:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}


