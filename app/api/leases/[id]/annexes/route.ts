import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Expose property documents (uploaded by owner) as lease annexes for tenants
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    if (!leaseId) {
      return NextResponse.json({ error: "ID de bail requis" }, { status: 400 })
    }

    const server = createServerClient()

    // Fetch lease to get the related property_id
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    // Fetch property documents uploaded by the owner
    const { data: docs, error: docsError } = await server
      .from("property_documents")
      .select("id, document_type, document_name, file_url, file_size, uploaded_at")
      .eq("property_id", lease.property_id)
      .order("uploaded_at", { ascending: false })

    if (docsError) {
      return NextResponse.json({ error: "Erreur récupération documents" }, { status: 500 })
    }

    // Map property document types to tenant annex types when needed
    const typeMapping: Record<string, string> = {
      // Harmonisation des clés entre owner et tenant
      insurance: "assurance_pno",
      energy_audit: "audit_energetique",
      electrical_safety: "diagnostic_electricite",
      gas_safety: "diagnostic_gaz",
      asbestos: "diagnostic_amiante",
      lead: "diagnostic_plomb",
      dpe: "dpe",
      erp: "erp",
      // Ces catégories agrégées peuvent ne pas correspondre 1:1 aux annexes
      copropriety_docs: "charges_copropriete",
      other: "autres",
    }

    const annexes = (docs || []).map((d) => ({
      id: d.id,
      annex_type: typeMapping[d.document_type as string] || (d.document_type as string) || "autres",
      file_name: d.document_name,
      file_url: d.file_url,
      file_size: d.file_size ?? 0,
      uploaded_at: d.uploaded_at,
    }))

    return NextResponse.json({ annexes })
  } catch (error) {
    console.error("Erreur /api/leases/[id]/annexes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUCKET_NAME = "lease-annexes";

// GET - Récupérer les annexes d'un bail
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const leaseId = params.id;

    const { data, error } = await supabase
      .from("lease_annexes")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ annexes: data });
  } catch (error) {
    console.error("❌ Erreur API GET annexes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter une annexe
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const leaseId = params.id;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const filePath = `${leaseId}/${Date.now()}-${file.name}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
        console.error("❌ Erreur d'upload Supabase:", uploadError);
        // L'erreur RLS se produira ici si les permissions du bucket sont incorrectes
        return NextResponse.json({ error: "Erreur lors de l'upload du fichier." }, { status: 500 });
    }

    // 2. Add entry to 'lease_annexes' table
    const { data, error: dbError } = await supabase
      .from("lease_annexes")
      .insert({
        lease_id: leaseId,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
        console.error("❌ Erreur DB lors de l'ajout de l'annexe:", dbError);
        // L'erreur RLS se produira ici si les permissions de la table sont incorrectes
        return NextResponse.json({ error: "Erreur lors de la sauvegarde de l'annexe." }, { status: 500 });
    }

    return NextResponse.json({ success: true, annexe: data });

  } catch (error) {
    console.error("❌ Erreur API POST annexes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une annexe
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = createServerClient();
        const annexeId = params.id; // L'ID de l'annexe est passé dans l'URL
        
        // 1. Récupérer le chemin du fichier avant de supprimer l'entrée de la BDD
        const { data: annexe, error: fetchError } = await supabase
            .from("lease_annexes")
            .select("file_path")
            .eq("id", annexeId)
            .single();

        if (fetchError || !annexe) {
            return NextResponse.json({ error: "Annexe non trouvée" }, { status: 404 });
        }

        // 2. Supprimer de la base de données
        const { error: dbError } = await supabase
            .from("lease_annexes")
            .delete()
            .eq("id", annexeId);

        if (dbError) throw dbError;

        // 3. Supprimer du stockage
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([annexe.file_path]);
        
        if (storageError) {
            // Log l'erreur mais ne bloque pas la réponse, car la référence en BDD est déjà supprimée
            console.error("Erreur suppression fichier du storage:", storageError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur API DELETE annexe:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
