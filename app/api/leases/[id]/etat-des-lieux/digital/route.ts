import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/leases/[id]/etat-des-lieux/digital
// Récupère un état des lieux numérique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'entree'
    const server = createServerClient()

    // Récupérer l'état des lieux numérique
    const { data: document, error } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", type)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Erreur récupération numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ data: { general_info: null, rooms: [] }, status: "draft" })
    }

    return NextResponse.json({ data: document.digital_data || { general_info: null, rooms: [] }, status: document.status })
  } catch (error) {
    console.error("Erreur GET digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/leases/[id]/etat-des-lieux/digital
// Sauvegarde un état des lieux numérique
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { general_info, rooms, property_data, lease_data, owner_signature, tenant_signature, validated, new_version } = await request.json()
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

    // Préparer les données numériques
    const digitalData = {
      general_info,
      rooms,
      property_data,
      lease_data,
      signatures: {
        owner: owner_signature || null,
        tenant: tenant_signature || null,
      },
      created_at: new Date().toISOString(),
    }

    const docType = (general_info?.type || "entree") as string

    // Chercher un document existant (sauf si on force une nouvelle version)
    const { data: existing, error: findError } = new_version
      ? { data: null as any, error: null as any }
      : await server
      .from("etat_des_lieux_documents")
      .select("id")
      .eq("lease_id", leaseId)
      .eq("type", docType)
      .maybeSingle()

    // Interdiction: si un document signé existe déjà pour ce bail/type, interdire la création d'une nouvelle version
    if (new_version) {
      const { count } = await server
        .from("etat_des_lieux_documents")
        .select("id", { count: "exact", head: true })
        .eq("lease_id", leaseId)
        .eq("type", docType)
        .eq("status", "signed")
      if ((count || 0) > 0) {
        return NextResponse.json({ error: "Un état des lieux signé existe déjà" }, { status: 403 })
      }
    }

    if (findError) {
      console.error("Erreur recherche document existant:", findError)
    }

    let document: any = null
    let error: any = null

    if (existing?.id) {
      // Protection: si déjà signé/complet et pas de nouvelle version -> bloquer modifications
      const { data: existingRow } = await server
        .from("etat_des_lieux_documents")
        .select("status")
        .eq("id", existing.id)
        .single()
      if ((existingRow?.status === "signed" || existingRow?.status === "completed") && !validated && !new_version) {
        return NextResponse.json({ error: "Document finalisé - création d'une nouvelle version requise" }, { status: 403 })
      }
      const { data, error: updateError } = await server
        .from("etat_des_lieux_documents")
        .update({
          property_id: lease.property_id,
          status: validated ? (owner_signature && tenant_signature ? "signed" : "completed") : "draft",
          digital_data: digitalData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()
      document = data
      error = updateError
    } else {
      const { data, error: insertError } = await server
        .from("etat_des_lieux_documents")
        .insert({
          lease_id: leaseId,
          property_id: lease.property_id,
          type: docType,
          status: validated ? (owner_signature && tenant_signature ? "signed" : "completed") : "draft",
          digital_data: digitalData,
        })
        .select()
        .single()
      document = data
      error = insertError
    }

    if (error) {
      console.error("Erreur sauvegarde numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    // Si validé et signatures présentes, générer le PDF via la route dédiée (design unifié) et le stocker
    if (validated && owner_signature && tenant_signature) {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/leases/${leaseId}/etat-des-lieux/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: docType }),
        })

        // Même si la réponse n'est pas utilisée côté client ici, la route PDF s'occupe d'uploader et de mettre à jour file_url
        if (!resp.ok) {
          console.warn("Génération PDF (route PDF) a échoué, code:", resp.status)
        } else {
          // Marquer le document comme signé (file_url sera déjà mis à jour par la route PDF)
          await server
            .from("etat_des_lieux_documents")
            .update({ status: "signed", updated_at: new Date().toISOString() })
            .eq("id", document.id)
        }
      } catch (e) {
        console.error("Erreur appel route PDF pour EDL:", e)
      }
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Erreur digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
