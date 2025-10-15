import { createServiceSupabaseClient } from "@/lib/supabase-server-client"
import { NextRequest, NextResponse } from "next/server"

async function requireAdmin(request: NextRequest) {
  const admin = createServiceSupabaseClient()
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: tokenData, error: tokenError } = await admin.auth.getUser(token)
  if (tokenError || !tokenData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check admin via DB profile first
  const { data: userProfile } = await admin.from("users").select("user_type").eq("id", tokenData.user.id).maybeSingle()
  const isAdminDb = !!userProfile && userProfile.user_type === "admin"

  // Fallback: allow if user_metadata/app_metadata marks admin
  const userMeta = (tokenData.user as any)?.user_metadata || {}
  const appMeta = (tokenData.user as any)?.app_metadata || {}
  const isAdminMeta = userMeta.user_type === "admin" || appMeta.user_type === "admin"

  if (!isAdminDb && !isAdminMeta) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const admin = createServiceSupabaseClient()
    const { features, quotas } = await request.json()

    // Mettre à jour les fonctionnalités et quotas du plan
    const { error } = await admin
      .from("pricing_plans")
      .update({ 
        features: features || [],
        quotas: quotas || {}
      })
      .eq("id", params.id)

    if (error) {
      console.error("❌ Erreur mise à jour fonctionnalités:", error)
      return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("❌ Erreur API features:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
