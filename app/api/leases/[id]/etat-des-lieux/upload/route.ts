import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { supabaseStorageService } from "@/lib/supabase-storage-service"

// POST /api/leases/[id]/etat-des-lieux/upload
// Upload un document d'état des lieux
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const server = createServerClient()

    // Vérifier que le bail existe
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!type || !["entree", "sortie"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 })
    }

    // Upload du fichier vers Supabase Storage
    const fileName = `etat-des-lieux-${type}-${Date.now()}.${file.name.split('.').pop()}`
    const filePath = `leases/${leaseId}/etat-des-lieux/${fileName}`

    const { data: uploadData, error: uploadError } = await supabaseStorageService.uploadFile(
      file,
      filePath,
      "etat-des-lieux"
    )

    if (uploadError) {
      console.error("Erreur upload:", uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 })
    }

    // Créer l'entrée en base de données
    const { data: document, error: dbError } = await server
      .from("etat_des_lieux_documents")
      .insert({
        lease_id: leaseId,
        property_id: lease.property_id,
        type,
        status: "completed",
        file_url: uploadData.url,
        file_name: fileName,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Erreur création document:", dbError)
      return NextResponse.json({ error: "Erreur lors de la création du document" }, { status: 500 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Erreur upload etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
