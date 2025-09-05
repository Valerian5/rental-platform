import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  delete body.id // Ne pas mettre à jour l'ID

  // Gérer le cas 'is_default'
  if (body.is_default) {
    // Mettre tous les autres à false
    await supabase.from("surety_bond_templates").update({ is_default: false }).neq("id", params.id)
  }

  const { data, error } = await supabase.from("surety_bond_templates").update(body).eq("id", params.id).select().single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from("surety_bond_templates").delete().eq("id", params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}