import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("surety_bond_templates").select("*").order("created_at")
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { data, error } = await supabase.from("surety_bond_templates").insert(body).select().single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}