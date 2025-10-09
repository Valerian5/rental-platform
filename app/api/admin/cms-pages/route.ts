import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

function supabaseAdmin() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  })
}

async function requireAdmin(request: NextRequest) {
  const admin = supabaseAdmin()
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: tokenData, error: tokenError } = await admin.auth.getUser(token)
  if (tokenError || !tokenData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: userProfile } = await admin.from("users").select("user_type").eq("id", tokenData.user.id).single()
  if (!userProfile || userProfile.user_type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return null
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const admin = supabaseAdmin()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  let query = admin.from("cms_pages").select("*").order("updated_at", { ascending: false })
  if (status) query = query.eq("status", status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const body = await request.json()
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from("cms_pages")
    .insert({
      slug: body.slug,
      title: body.title,
      description: body.description ?? null,
      blocks: body.blocks ?? [],
      seo: body.seo ?? {},
      status: body.status ?? "draft",
      published_at: body.status === "published" ? new Date().toISOString() : null,
      author_id: body.author_id ?? null,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const admin = supabaseAdmin()
  const updates: any = {
    slug: body.slug,
    title: body.title,
    description: body.description ?? null,
    blocks: body.blocks ?? [],
    seo: body.seo ?? {},
    status: body.status ?? "draft",
  }
  if (body.status === "published") updates.published_at = new Date().toISOString()

  const { data, error } = await admin.from("cms_pages").update(updates).eq("id", body.id).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const admin = supabaseAdmin()
  const { error } = await admin.from("cms_pages").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}


