import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import n2words from "n2words";

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

function buildFlatContext(lease: any, leaseData: any, guarantor: any, options: any) {
  const totalRent = (lease?.rent_amount || leaseData?.montant_loyer_mensuel || 0) + (lease?.charges_amount || leaseData?.montant_charges || 0);
  const loyerChiffres = Number(leaseData?.montant_loyer_mensuel || totalRent || 0);
  const montantLettres = loyerChiffres > 0 ? n2words(loyerChiffres, { lang: "fr" }) : "";

  return {
    // Caution (garant)
    caution_nom_prenom: `${guarantor.firstName || ""} ${guarantor.lastName || ""}`.trim(),
    caution_date_naissance: guarantor.birthDate ? new Date(guarantor.birthDate).toLocaleDateString("fr-FR") : "",
    caution_lieu_naissance: guarantor.birthPlace || "",
    caution_adresse: guarantor.address || "",
    caution_email: guarantor.email || "",
    // Options
    caution_type: options?.caution_type || "solidaire", // simple | solidaire
    engagement_type: options?.engagement_type || "indeterminee", // indeterminee | determinee
    engagement_precision: options?.engagement_precision || "",
    // Locataire
    locataire_nom_prenom:
      leaseData?.locataire_nom_prenom ||
      `${lease?.tenant?.first_name || ""} ${lease?.tenant?.last_name || ""}`.trim(),
    // Bailleur
    bailleur_nom_prenom:
      leaseData?.bailleur_nom_prenom ||
      `${lease?.owner?.first_name || ""} ${lease?.owner?.last_name || ""}`.trim(),
    bailleur_adresse: leaseData?.bailleur_adresse || lease?.owner?.address || "",
    // Logement
    adresse_logement: leaseData?.adresse_logement || lease?.property?.address || "",
    ville_logement: lease?.property?.city || "",
    // Loyer
    montant_loyer_mensuel: loyerChiffres,
    montant_loyer_lettres: montantLettres,
    periodicite: leaseData?.periodicite || "mois",
    date_revision: leaseData?.date_revision || "",
    irl_trimestre: lease?.revision_index_reference || "",
    irl_annee: leaseData?.irl_annee || "",
    // Mentions
    date_acte: new Date().toLocaleDateString("fr-FR"),
    lieu_signature: leaseData?.lieu_signature || "",
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
        `*, property:properties(address, city), tenant:users!leases_tenant_id_fkey(first_name, last_name), owner:users!leases_owner_id_fkey(first_name, last_name, address)`
      )
      .eq("id", leaseId)
      .single();

    if (leaseError) return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 });

    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates")
      .select("*")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();

    if (templateError || !template?.content) {
      return NextResponse.json({ error: "Modèle d'acte de cautionnement introuvable." }, { status: 404 });
    }

    const flat = buildFlatContext(lease, leaseData, guarantor, options);

    const html = fillTemplate(template.content, flat);
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}