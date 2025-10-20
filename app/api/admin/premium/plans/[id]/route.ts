import { type NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest) {
  const admin = createServiceSupabaseClient()
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: tokenData, error: tokenError } = await admin.auth.getUser(token)
  if (tokenError || !tokenData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: userProfile } = await admin.from("users").select("user_type").eq("id", tokenData.user.id).single()
  if (!userProfile || userProfile.user_type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return null
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const admin = createServiceSupabaseClient()
    const data = await request.json()

    const { error } = await admin
      .from("pricing_plans")
      .update({
        display_name: data.display_name,
        description: data.description,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        stripe_product_id: data.stripe_product_id,
        stripe_price_monthly_id: data.stripe_price_monthly_id,
        stripe_price_yearly_id: data.stripe_price_yearly_id,
        is_free: data.is_free,
        is_popular: data.is_popular,
        max_properties: data.max_properties,
        max_tenants: data.max_tenants,
        max_storage_gb: data.max_storage_gb,
        sort_order: data.sort_order,
      })
      .eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("❌ Erreur mise à jour plan:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}


