import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const data = await request.json()

    const { error } = await supabase
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


