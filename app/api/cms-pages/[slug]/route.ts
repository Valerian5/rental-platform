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

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from("cms_pages")
    .select("id, slug, title, description, blocks, seo, status, published_at, updated_at")
    .eq("slug", params.slug)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  if (!data || data.status !== "published") return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data })
}


