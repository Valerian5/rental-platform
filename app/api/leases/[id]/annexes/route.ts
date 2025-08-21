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
