import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await _req.json()
    const { decision, reason } = body as { decision: "accept" | "refuse"; reason?: string }

    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("*, tenant:users!applications_tenant_id_fkey(*), property:properties(*, owner:users(*))")
      .eq("id", params.id)
      .single()
    if (appErr || !app) return NextResponse.json({ error: "Application introuvable" }, { status: 404 })

    if (decision === "accept") {
      const { data, error } = await supabase
        .from("applications")
        .update({
          status: "accepted",
          tenant_confirmation_status: "accepted",
          tenant_refusal_reason: null,
          tenant_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .select()
        .single()
      if (error) throw error

      await emailService.sendTenantConfirmedApplicationEmailToOwner(
        { id: app.property.owner.id, name: `${app.property.owner.first_name} ${app.property.owner.last_name}`, email: app.property.owner.email },
        `${app.tenant.first_name} ${app.tenant.last_name}`,
        { id: app.property.id, title: app.property.title, address: app.property.address },
        `${process.env.NEXT_PUBLIC_SITE_URL}/owner/applications/${app.id}`,
      )

      return NextResponse.json({ application: data })
    }

    // decision === "refuse"
    const { data, error } = await supabase
      .from("applications")
      .update({
        status: "rejected",
        tenant_confirmation_status: "refused",
        tenant_refusal_reason: reason || null,
        tenant_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()
    if (error) throw error

    await emailService.sendEmail({
      to: app.property.owner.email,
      template: "tenant_refused_application",
      data: {
        ownerName: `${app.property.owner.first_name} ${app.property.owner.last_name}`,
        tenantName: `${app.tenant.first_name} ${app.tenant.last_name}`,
        propertyTitle: app.property.title,
        reason: reason || "Sans précision",
        manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/owner/applications/${app.id}`,
      },
    })

    return NextResponse.json({ application: data })
  } catch (e: any) {
    console.error("tenant-decision error:", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
