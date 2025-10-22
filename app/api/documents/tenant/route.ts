import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"
import { emailService } from "@/lib/email-service"

// GET /api/documents/tenant - liste les documents du locataire connecté
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient()

    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    const { data: { user }, error: userError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Récupère les documents du locataire
    const { data: docs, error } = await supabase
      .from("tenant_documents")
      .select(`
        id,
        lease_id,
        tenant_id,
        document_type,
        title,
        description,
        document_url,
        document_filename,
        document_size,
        mime_type,
        status,
        created_at,
        metadata,
        created_by
      `)
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [TENANT DOCS] Erreur récupération:", error)
      return NextResponse.json({ success: false, error: "Impossible de récupérer le document" }, { status: 500 })
    }

    const mapped = (docs || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      type: d.mime_type?.includes("pdf") ? "pdf" : d.mime_type?.startsWith("image/") ? "image" : "document",
      category: d.metadata?.category || d.document_type || "other",
      file_url: d.document_url,
      file_size: d.document_size,
      created_at: d.created_at,
      uploaded_by: { id: d.created_by || user.id, first_name: "Vous", last_name: "" },
    }))

    return NextResponse.json({ success: true, documents: mapped }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("❌ [TENANT DOCS] Erreur:", err)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/documents/tenant - upload d'un document obligatoire par le locataire
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient()

    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
    const { data: { user }, error: userError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get("file") as File | null
    const leaseId = String(form.get("lease_id") || "")
    const documentType = String(form.get("document_type") || "statement") // Toujours "statement" pour les documents obligatoires
    const documentCategory = String(form.get("document_category") || "other") // Catégorie spécifique (insurance, boiler_service, etc.)
    const title = String(form.get("title") || "Document locataire")
    const description = String(form.get("description") || "")
    const expiryDate = String(form.get("expiry_date") || "") // ISO date optionnelle

    if (!file || !leaseId) {
      return NextResponse.json({ success: false, error: "Fichier et lease_id requis" }, { status: 400 })
    }

    // Upload vers Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${user.id}.${fileExt}`
    const objectPath = `tenants/${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(objectPath, file)

    if (uploadError) {
      console.error('❌ [TENANT DOCS] Erreur upload:', uploadError)
      return NextResponse.json({ success: false, error: "Erreur upload" }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage
      .from('documents')
      .getPublicUrl(objectPath)

    // Insérer l'entrée dans tenant_documents
    const { data: inserted, error: insertError } = await supabase
      .from('tenant_documents')
      .insert({
        lease_id: leaseId,
        tenant_id: user.id,
        document_type: documentType,
        title,
        description,
        document_url: publicUrl.publicUrl,
        document_filename: file.name,
        document_size: (file as any).size,
        mime_type: file.type,
        status: 'available',
        created_by: user.id,
        metadata: {
          category: documentCategory, // Utiliser la catégorie spécifique
          original_type: documentType, // Garder le type original
          expiry_date: expiryDate || null,
          uploaded_by: 'tenant'
        }
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ [TENANT DOCS] Erreur insertion:', insertError)
      return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 })
    }

    // Avertir le propriétaire par email (si bail lié)
    try {
      const { data: lease } = await supabase
        .from('leases')
        .select('id, owner:users!leases_owner_id_fkey(id, email, first_name, last_name), property:properties(id,title)')
        .eq('id', leaseId)
        .single()

      if (lease?.owner?.email) {
        await emailService.sendTenantDocumentUploadedEmail(
          { id: lease.owner.id, name: `${lease.owner.first_name} ${lease.owner.last_name}`, email: lease.owner.email },
          { id: user.id },
          { id: inserted.id, title: inserted.title, type: documentType, url: inserted.document_url },
          { id: lease.property?.id, title: lease.property?.title }
        )
      }
    } catch (notifyError) {
      console.warn('⚠️ [TENANT DOCS] Notification owner échouée:', notifyError)
    }

    return NextResponse.json({ success: true, document: inserted })
  } catch (err) {
    console.error('❌ [TENANT DOCS] Erreur:', err)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}


