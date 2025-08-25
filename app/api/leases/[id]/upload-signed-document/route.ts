import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const formData = await request.formData()
    const file = formData.get("document") as File
    const signerType = formData.get("signerType") as string // 'owner' | 'tenant'

    if (!file) {
      return NextResponse.json({ success: false, error: "Fichier manquant" }, { status: 400 })
    }

    if (!["owner", "tenant"].includes(signerType)) {
      return NextResponse.json({ success: false, error: "Type de signataire invalide" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Vérifier que le bail existe
    const { data: lease, error: leaseError } = await supabase.from("leases").select("*").eq("id", leaseId).single()

    if (leaseError || !lease) {
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    const uploadResult = await SupabaseStorageService.uploadFile(file, "lease-documents", `signed-documents/${leaseId}`)

    // Mettre à jour le bail avec le document signé
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (signerType === "owner") {
      updateData.signed_by_owner = true
      updateData.owner_signature_date = new Date().toISOString()
      updateData.owner_signed_document_url = uploadResult.url
    } else {
      updateData.signed_by_tenant = true
      updateData.tenant_signature_date = new Date().toISOString()
      updateData.tenant_signed_document_url = uploadResult.url
    }

    // Si les deux parties ont signé, marquer le bail comme actif
    if ((signerType === "owner" && lease.signed_by_tenant) || (signerType === "tenant" && lease.signed_by_owner)) {
      updateData.status = "active"
    } else {
      updateData.status = signerType === "owner" ? "signed_by_owner" : "signed_by_tenant"
    }

    const { error: updateError } = await supabase.from("leases").update(updateData).eq("id", leaseId)

    if (updateError) {
      console.error("❌ Erreur mise à jour bail:", updateError)
      return NextResponse.json({ success: false, error: "Erreur mise à jour du bail" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Document signé uploadé avec succès",
      documentUrl: uploadResult.url,
      leaseStatus: updateData.status,
    })
  } catch (error) {
    console.error("❌ Erreur upload document signé:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
