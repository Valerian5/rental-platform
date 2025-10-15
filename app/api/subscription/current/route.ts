import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@supabase/supabase-js"
import { resolveUserPlan } from "@/lib/subscription-resolver"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
    const token = hasBearer ? authHeader.slice(7) : null
    const supabase = hasBearer
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
      : createServerClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const resolved = await resolveUserPlan(user.id)
    return NextResponse.json({ success: true, planId: resolved.planId, scope: resolved.scope, plan: resolved.plan })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}


