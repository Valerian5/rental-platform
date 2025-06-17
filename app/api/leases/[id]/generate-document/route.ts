import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Simple template engine pour remplacer Handlebars
function compileTemplate(template: string, data: any): string {
  let result = template

  // Remplacer les variables simples {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })

  // Remplacer les conditions {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? content : ""
  })

  // Remplacer les boucles {{#each array}}...{{/each}}
  result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
    const array = data[key]
    if (!Array.isArray(array)) return ""

    return array
      .map((item) => {
        let itemContent = content
        // Remplacer {{this}} par l'élément actuel
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item))
        return itemContent
      })
      .join("")
  })

  return result
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔄 Génération document pour bail:", params.id)

    // Récupérer le bail avec toutes les informations
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!tenant_id(*),
        owner:users!owner_id(*)
      `)
      .eq("id", params.id)
      .single()

    if (leaseError) throw leaseError

    console.log("📋 Bail récupéré:", lease.id)

    // Récupérer le template approprié
    const { data: template, error: templateError } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("lease_type", lease.lease_type)
      .eq("is_default", true)
      .eq("is_active", true)
      .single()

    if (templateError) throw templateError

    console.log("📄 Template récupéré:", template.name)

    // Préparer les données pour le template
    const templateData = {
      // Informations du bailleur
      nom_bailleur: `${lease.owner.first_name} ${lease.owner.last_name}`,
      adresse_bailleur: lease.owner.address || "Adresse non renseignée",
      email_bailleur: lease.owner.email,
      telephone_bailleur: lease.owner.phone || "",

      // Informations du locataire
      nom_locataire: `${lease.tenant.first_name} ${lease.tenant.last_name}`,
      adresse_locataire: lease.tenant.address || "Adresse non renseignée",
      email_locataire: lease.tenant.email,
      telephone_locataire: lease.tenant.phone || "",

      // Informations du bien
      adresse_postale: lease.property.address,
      code_postal: lease.property.postal_code || "",
      ville: lease.property.city,
      type_logement: lease.property.type,
      surface_m2: lease.property.surface,
      nombre_pieces: lease.property.rooms || 1,
      etage: lease.property.floor || "",

      // Zone géographique (à déterminer selon la ville)
      zone_geographique: getZoneGeographique(lease.property.city),

      // Conditions financières
      loyer: lease.monthly_rent,
      charges: lease.charges || 0,
      loyer_cc: lease.monthly_rent + (lease.charges || 0),
      depot_garantie: lease.deposit || 0,
      nb_mois_depot: Math.round((lease.deposit || 0) / lease.monthly_rent),

      // Dates
      date_debut: formatDate(lease.start_date),
      date_fin: formatDate(lease.end_date),
      duree: lease.lease_type === "furnished" ? 12 : 36,

      // Équipements (pour meublé)
      equipements_obligatoires: lease.metadata?.furnished_items || [],
      equipements_supplementaires: [],

      // Usage
      usage_prevu: "résidence principale",

      // Clauses particulières
      clauses_particulieres: lease.metadata?.special_conditions || "",

      // Documents annexes (par défaut)
      dpe: true,
      etat_risques: true,
      diagnostic_electrique: false,
      diagnostic_gaz: false,
      surface_carrez: false,
      notice_informative: true,
      reglement_copro: false,

      // Signature
      ville_signature: lease.property.city,
      date_signature: formatDate(new Date().toISOString()),
    }

    console.log("📊 Données template préparées")

    // Compiler le template avec notre moteur simple
    const generatedDocument = compileTemplate(template.template_content, templateData)

    console.log("✅ Document généré")

    // Sauvegarder le document généré dans le bail
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        generated_document: generatedDocument,
        document_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      document: generatedDocument,
      template_used: template.name,
    })
  } catch (error) {
    console.error("❌ Erreur génération document:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la génération du document" }, { status: 500 })
  }
}

// Fonction helper pour déterminer la zone géographique
function getZoneGeographique(ville: string): string {
  const villeNormalized = ville.toLowerCase()

  // Paris
  if (villeNormalized.includes("paris")) {
    return "Paris"
  }

  // Zones tendues (liste simplifiée)
  const zonesTendues = [
    "marseille",
    "lyon",
    "toulouse",
    "nice",
    "nantes",
    "montpellier",
    "strasbourg",
    "bordeaux",
    "lille",
    "rennes",
    "reims",
    "toulon",
    "saint-étienne",
    "le havre",
    "grenoble",
    "dijon",
    "angers",
    "nîmes",
    "villeurbanne",
    "saint-denis",
    "aix-en-provence",
    "brest",
    "limoges",
    "tours",
    "amiens",
    "perpignan",
    "metz",
    "besançon",
    "orléans",
    "mulhouse",
    "rouen",
    "caen",
    "nancy",
  ]

  const isZoneTendue = zonesTendues.some((zoneTendue) => villeNormalized.includes(zoneTendue))

  return isZoneTendue ? "zone tendue" : "zone non tendue"
}

// Fonction helper pour formater les dates
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
