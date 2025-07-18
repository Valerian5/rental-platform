import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id

    const { data: annexes, error } = await supabase
      .from("lease_annexes")
      .select("*")
      .eq("lease_id", leaseId)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération annexes:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      annexes: annexes || [],
    })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Upload vers Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `leases/${leaseId}/annexes/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("lease-annexes").upload(filePath, file)

    if (uploadError) {
      console.error("Erreur upload:", uploadError)
      return NextResponse.json({ success: false, error: "Erreur lors de l'upload" }, { status: 500 })
    }

    // Enregistrer en base
    const { data: annexe, error: dbError } = await supabase
      .from("lease_annexes")
      .insert({
        lease_id: leaseId,
        name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error("Erreur base de données:", dbError)
      return NextResponse.json({ success: false, error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      annexe,
    })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
