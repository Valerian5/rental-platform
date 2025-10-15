import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

// Public endpoint to get page access rule by path
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.searchParams.get("path")
    if (!path) return NextResponse.json({ success: false, error: "path requis" }, { status: 400 })

    const supabase = createServiceSupabaseClient()
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "page_module_access")
      .maybeSingle()

    if (error) return NextResponse.json({ success: false, error: "DB error" }, { status: 500 })

    const list = Array.isArray(data?.setting_value) ? (data!.setting_value as any[]) : []
    // Chercher la règle la plus spécifique dont le path est un préfixe du chemin demandé
    const candidates = list.filter((r: any) => typeof r?.path === "string" && path.startsWith(r.path))
    const rule = candidates.sort((a: any, b: any) => b.path.length - a.path.length)[0] || null
    return NextResponse.json({ success: true, rule })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}


