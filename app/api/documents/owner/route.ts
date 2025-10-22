import { type NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

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

    // Vérifier que l'utilisateur est un propriétaire
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", user.id)
      .single()

    if (userDataError || !userData || userData.user_type !== "owner") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les documents des locataires pour les propriétés du propriétaire
    const { data: documents, error } = await supabase
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
        created_by,
        lease:leases!tenant_documents_lease_id_fkey(
          id,
          property_id,
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          property:properties(
            id,
            title,
            address
          )
        )
      `)
      .eq("lease.property.owner_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [OWNER DOCS] Erreur récupération documents:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des documents" }, { status: 500 })
    }

    const mapped = (documents || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      type: doc.mime_type?.includes("pdf") ? "pdf" : doc.mime_type?.startsWith("image/") ? "image" : "document",
      category: doc.metadata?.category || doc.document_type || "other",
      file_url: doc.document_url,
      file_size: doc.document_size,
      created_at: doc.created_at,
      status: doc.status,
      tenant: {
        id: doc.lease?.tenant?.id,
        name: `${doc.lease?.tenant?.first_name || ''} ${doc.lease?.tenant?.last_name || ''}`.trim(),
        email: doc.lease?.tenant?.email
      },
      property: {
        id: doc.lease?.property?.id,
        title: doc.lease?.property?.title,
        address: doc.lease?.property?.address
      },
      uploaded_by: {
        id: doc.created_by || doc.tenant_id,
        name: doc.lease?.tenant ? `${doc.lease.tenant.first_name} ${doc.lease.tenant.last_name}` : "Locataire"
      }
    }))

    return NextResponse.json({ success: true, documents: mapped }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("❌ [OWNER DOCS] Erreur:", err)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
