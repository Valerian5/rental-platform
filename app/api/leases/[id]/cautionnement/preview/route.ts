import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

function fillTemplate(templateContent: string, context: Record<string, any>): string {
  return templateContent.replace(/{{\s*([\w.]+)\s*}}/g, (match, placeholder) => {
    const keys = placeholder.split(".");
    let value: any = context;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return match;
    }
    return value ?? "";
  });
}

// Normalise les mentions légales et structure d'entrée selon la référence
// https://www.service-public.fr/simulateur/calcul/ActeCautionnement
function buildContext(lease: any, leaseData: any, guarantor: any, options: any) {
  const totalRent = (lease.rent_amount || 0) + (lease.charges_amount || 0);

  return {
    caution: {
      type: options?.caution_type || "solidaire", // "simple" | "solidaire"
      duree_type: options?.engagement_type || "indeterminee", // "indeterminee" | "determinee"
      duree_precision: options?.engagement_precision || "", // ex: "Durée du bail et d'un renouvellement - Durée de 3 ans - Jusqu'au JJ/MM/AAAA"
      nom_prenom: `${guarantor.firstName} ${guarantor.lastName}`,
      date_naissance: new Date(guarantor.birthDate).toLocaleDateString("fr-FR"),
      lieu_naissance: guarantor.birthPlace,
      adresse: guarantor.address,
    },
    locataire: {
      nom_prenom: leaseData?.locataire_nom_prenom || `${lease?.tenant?.first_name || ""} ${lease?.tenant?.last_name || ""}`.trim(),
    },
    bailleur: {
      nom_prenom: leaseData?.bailleur_nom_prenom || `${lease?.owner?.first_name || ""} ${lease?.owner?.last_name || ""}`.trim(),
      adresse: leaseData?.bailleur_adresse || "Adresse non renseignée",
    },
    logement: {
      adresse: leaseData?.adresse_logement || lease?.property?.address || "",
      ville: lease?.property?.city || "",
    },
    loyer: {
      montant_lettres: leaseData?.montant_loyer_lettres || "",
      montant_chiffres: leaseData?.montant_loyer_mensuel || totalRent,
      periodicite: leaseData?.periodicite || "mois",
      date_revision: leaseData?.date_revision || "",
      irl_trimestre: lease?.revision_index_reference || "",
      irl_annee: leaseData?.irl_annee || "",
      montant_max_lettres: leaseData?.montant_max_lettres || "",
      montant_max_chiffres: leaseData?.montant_max_chiffres || "",
    },
    date_et_lieu_acte: {
      date: new Date().toLocaleDateString("fr-FR"),
      lieu: leaseData?.lieu_signature || "",
    },
    mentions_legales: {
      art_22_1: true,
      art_2297: true,
    },
  };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const leaseId = params.id;

  try {
    const { guarantor, leaseData, options } = await request.json();

    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(
        `*, property:properties(address, city), tenant:users!leases_tenant_id_fkey(first_name, last_name), owner:users!leases_owner_id_fkey(first_name, last_name)`
      )
      .eq("id", leaseId)
      .single();

    if (leaseError) return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 });

    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates")
      .select("content")
      .eq("is_default", true)
      .single();

    if (templateError || !template?.content) {
      return NextResponse.json({ error: "Modèle d'acte introuvable." }, { status: 500 });
    }

    const context = buildContext(lease, leaseData, guarantor, options);
    const htmlContent = fillTemplate(template.content, context);

    return new NextResponse(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Erreur preview cautionnement:", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}