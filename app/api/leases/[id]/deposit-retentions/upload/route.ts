import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const supabase = hasBearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : createServerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const form = await request.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())

    // Vérifier le bail et propriétaire
    const { data: lease } = await supabase
      .from("leases")
      .select("id, owner_id")
      .eq("id", leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    // Upload via service client pour rendre public
    const { createServiceSupabaseClient } = await import("@/lib/supabase-server-client")
    const admin = createServiceSupabaseClient()
    const ext = file.type === "application/pdf" ? "pdf" : (file.type.split("/")[1] || "bin")
    const path = `deposit-retentions/${leaseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await admin.storage.from("documents").upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: true })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    const { data: { publicUrl } } = admin.storage.from("documents").getPublicUrl(path)

    return NextResponse.json({ success: true, publicUrl, path })
  } catch (e: any) {
    console.error("deposit-retentions upload:", e)
    return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 })
  }
}


