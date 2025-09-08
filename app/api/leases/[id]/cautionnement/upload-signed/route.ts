// app/api/leases/[id]/cautionnement/upload-signed/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const supabase = createServerClient()

  try {
    const form = await request.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

    const filename = `${Date.now()}-${file.name}`
    const path = `leases/${leaseId}/caution_signed/${filename}`

    const arrayBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("lease-documents")
      .upload(path, new Uint8Array(arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

    if (uploadError) {
      console.error(uploadError)
      return NextResponse.json({ error: "Erreur upload" }, { status: 500 })
    }

    const { data: pub } = supabase.storage.from("lease-documents").getPublicUrl(path)
    const publicUrl = pub?.publicUrl

    // Optionnel: enregistrer en BDD (si tu as une table dédiée)
    // await supabase.from("lease_documents").insert({ lease_id: leaseId, type: "caution_signed", url: publicUrl })

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}