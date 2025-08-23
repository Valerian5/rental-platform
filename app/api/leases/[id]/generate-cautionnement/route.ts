import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { cautionData } = await request.json()

    const supabase = createServerClient()

    // Récupérer les données du bail
    const { data: lease, error: leaseError } = await supabase.from("leases").select("*").eq("id", leaseId).single()

    if (leaseError || !lease) {
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    // Récupérer le template d'acte de cautionnement depuis les paramètres admin
    const { data: templateSetting, error: templateError } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "cautionnement_template")
      .single()

    let template = ""
    if (templateError || !templateSetting?.setting_value) {
      // Template par défaut basé sur service-public.fr
      template = `
ACTE DE CAUTIONNEMENT

Je soussigné(e) {{caution_prenom}} {{caution_nom}}, né(e) le {{caution_date_naissance}} à {{caution_lieu_naissance}}, résidant à l'adresse suivante : {{caution_adresse}}, déclare me porter caution {{type_caution}} de {{locataire_nom_prenom}} pour les obligations résultant du bail qui lui a été consenti par le bailleur {{bailleur_nom_prenom}}, demeurant {{bailleur_adresse}} pour la location du logement situé {{adresse_logement}}.

J'ai pris connaissance du montant du loyer de {{montant_loyer_lettres}}, soit {{montant_loyer_chiffres}} € par mois. Il sera révisé annuellement tous les {{date_revision}} selon la variation de l'indice de référence des loyers publié par l'INSEE au {{trimestre_irl}} trimestre {{annee_irl}}.

Cet engagement vaut pour le paiement, en cas de défaillance du locataire, des loyers, des indemnités d'occupation, des charges, des réparations et des dégradations locatives, des impôts et taxes, des frais et dépens de procédure, des coûts des actes dus, dans la limite de {{montant_engagement_lettres}}, soit {{montant_engagement_chiffres}} €, en principal et accessoires.

Cet engagement est valable pour une durée {{duree_engagement}}.

Je reconnais avoir pris connaissance de l'avant-dernier alinéa de l'article 22-1 de la loi du 6 juillet 1989, selon lequel :

« Lorsque le cautionnement d'obligations résultant d'un contrat de location conclu en application du présent titre ne comporte aucune indication de durée ou lorsque la durée du cautionnement est stipulée indéterminée, la caution peut le résilier unilatéralement. La résiliation prend effet au terme du contrat de location, qu'il s'agisse du contrat initial ou d'un contrat reconduit ou renouvelé au cours duquel le bailleur reçoit notification de la résiliation. »

Je reconnais également avoir pris connaissance de l'article 2297 du code civil, selon lequel :

« Si la caution est privée des bénéfices de discussion ou de division, elle reconnaît ne pouvoir exiger du créancier qu'il poursuive d'abord le débiteur ou qu'il divise ses poursuites entre les cautions. À défaut, elle conserve le droit de se prévaloir de ces bénéfices. »

{{lieu_signature}}, le {{date_signature}}

Signature de la caution :
{{caution_prenom}} {{caution_nom}}
      `
    } else {
      template = templateSetting.setting_value
    }

    // Remplacer les variables dans le template
    const cautionnementDocument = template
      .replace(/{{caution_prenom}}/g, cautionData.prenom || "")
      .replace(/{{caution_nom}}/g, cautionData.nom || "")
      .replace(/{{caution_date_naissance}}/g, cautionData.dateNaissance || "")
      .replace(/{{caution_lieu_naissance}}/g, cautionData.lieuNaissance || "")
      .replace(/{{caution_adresse}}/g, cautionData.adresse || "")
      .replace(/{{type_caution}}/g, cautionData.typeCaution === "solidaire" ? "solidaire" : "simple")
      .replace(/{{locataire_nom_prenom}}/g, lease.locataire_nom_prenom || "")
      .replace(/{{bailleur_nom_prenom}}/g, lease.bailleur_nom_prenom || "")
      .replace(/{{bailleur_adresse}}/g, lease.bailleur_adresse || "")
      .replace(/{{adresse_logement}}/g, lease.adresse_logement || "")
      .replace(/{{montant_loyer_lettres}}/g, cautionData.montantLoyerLettres || "")
      .replace(/{{montant_loyer_chiffres}}/g, lease.montant_loyer_mensuel?.toString() || "")
      .replace(/{{date_revision}}/g, cautionData.dateRevision || "")
      .replace(/{{trimestre_irl}}/g, cautionData.trimestreIRL || "")
      .replace(/{{annee_irl}}/g, cautionData.anneeIRL || "")
      .replace(/{{montant_engagement_lettres}}/g, cautionData.montantEngagementLettres || "")
      .replace(/{{montant_engagement_chiffres}}/g, cautionData.montantEngagementChiffres || "")
      .replace(/{{duree_engagement}}/g, cautionData.dureeEngagement || "indéterminée")
      .replace(/{{lieu_signature}}/g, cautionData.lieuSignature || "")
      .replace(/{{date_signature}}/g, new Date().toLocaleDateString("fr-FR"))

    // Sauvegarder l'acte de cautionnement
    const { error: saveError } = await supabase.from("lease_cautionnements").upsert({
      lease_id: leaseId,
      caution_data: cautionData,
      generated_document: cautionnementDocument,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (saveError) {
      console.error("❌ Erreur sauvegarde cautionnement:", saveError)
      return NextResponse.json(
        { success: false, error: "Erreur sauvegarde de l'acte de cautionnement" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      document: cautionnementDocument,
      message: "Acte de cautionnement généré avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur génération cautionnement:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
