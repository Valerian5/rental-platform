import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import n2words from "n2words"

// Fonctions utilitaires (alignées avec la prévisualisation)
function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj)
}

function fillTemplate(templateContent: string, context: Record<string, any>): string {
  let output = templateContent
  const ifBlockRegex = /{{#if\s+([\w.]+)}}([\s\S]*?){{\/if}}/g
  output = output.replace(ifBlockRegex, (_m, condPath, inner) => {
    const [truthy, falsy] = inner.split(/{{else}}/)
    const value = getByPath(context, condPath)
    return value ? (truthy ?? "") : (falsy ?? "")
  })
  output = output.replace(/{{\s*([\w.]+)\s*}}/g, (match, placeholder) => {
    const value = getByPath(context, placeholder)
    return value !== undefined && value !== null ? String(value) : match
  })
  return output
}

// Fonction pour construire le contexte (alignée avec la prévisualisation)
function buildContext(lease: any, tenant: any, owner: any, guarantor: any, options: any) {
  const rentAmount = Number(lease?.monthly_rent || 0)
  const rentAmountInWords = rentAmount > 0 ? n2words(rentAmount, { lang: "fr" }) : ""
  const durationType = options?.engagement_type === "determinee" ? "déterminée" : "indéterminée"
  const isIndet = durationType === "indéterminée"
  const rentRevisionReference = lease?.trimestre_reference_irl || lease?.date_reference_irl || ""
  const choix = lease?.date_revision_loyer || ""
  const start = lease?.date_prise_effet || lease?.start_date || null
  let rentRevisionDate = ""
  const formatDateDayMonth = (d: string | Date | null) => {
    if (!d) return ""
    try {
      const date = new Date(d)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    } catch { return "" }
  }
  if (choix === "anniversaire") rentRevisionDate = formatDateDayMonth(start)
  else if (choix === "1er") {
    const base = start ? new Date(start) : new Date()
    const firstDay = new Date(base.getFullYear(), base.getMonth(), 1)
    rentRevisionDate = formatDateDayMonth(firstDay)
  } else if (choix === "autre") rentRevisionDate = "autre date"
  else rentRevisionDate = formatDateDayMonth(options?.rent_revision_date || lease?.date_revision)

  const maxAmount = options?.max_amount ? Number(options.max_amount) : 0
  const maxAmountInWords = maxAmount > 0 ? n2words(maxAmount, { lang: "fr" }) : ""

  let finalOwnerFirstName = owner?.first_name || ""
  let finalOwnerLastName = owner?.last_name || ""
  if ((!finalOwnerFirstName || !finalOwnerLastName) && lease?.bailleur_nom_prenom) {
    const parts = lease.bailleur_nom_prenom.split(' ').filter(Boolean)
    finalOwnerFirstName = parts[0] || ""
    finalOwnerLastName = parts.slice(1).join(' ') || ""
  }

  return {
    guarantor: {
      first_name: guarantor.firstName || "",
      last_name: guarantor.lastName || "",
      birth_date: guarantor.birthDate ? new Date(guarantor.birthDate).toLocaleDateString("fr-FR") : "",
      birth_place: guarantor.birthPlace || "",
      address: guarantor.address || "",
    },
    lease: {
      rent_amount: rentAmount,
      rent_amount_in_words: rentAmountInWords,
      rent_revision_date: rentRevisionDate,
      rent_revision_reference: rentRevisionReference,
      tenant: { first_name: tenant?.first_name || "", last_name: tenant?.last_name || "" },
      property: {
        address: lease?.adresse_logement || "",
        city: lease?.property?.city || lease?.ville || "",
        owner: {
          first_name: finalOwnerFirstName,
          last_name: finalOwnerLastName,
          address: lease?.adresse_bailleur || owner?.address || "",
        },
      },
    },
    duration_type: durationType,
    is_indetermined_duration: isIndet,
    duration_precision: options?.engagement_precision || "",
    max_amount_in_words: maxAmountInWords,
    max_amount: maxAmount ? String(maxAmount) : "",
    caution_type: options?.caution_type || "solidaire",
    Caution_type: options?.caution_type || "solidaire",
    today: new Date().toLocaleDateString("fr-FR"),
    lieu_signature: options?.lieu_signature || lease?.ville_signature || lease?.property?.city || "",
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const leaseId = params.id

  try {
    const { guarantor, options } = await request.json()

    if (!guarantor) {
      return NextResponse.json({ error: "Données du garant manquantes." }, { status: 400 })
    }
    
    // 1. Récupération des données (comme pour la preview)
    const { data: lease, error: leaseError } = await supabase
      .from("leases").select("*, property:properties(city)").eq("id", leaseId).single()
    if (leaseError || !lease) return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 })

    const [tenantRes, ownerRes] = await Promise.all([
      lease.tenant_id ? supabase.from("users").select("id, first_name, last_name").eq("id", lease.tenant_id).single() : Promise.resolve({ data: null }),
      lease.owner_id ? supabase.from("users").select("id, first_name, last_name, address").eq("id", lease.owner_id).single() : Promise.resolve({ data: null }),
    ])
    const tenant = tenantRes?.data || null
    const owner = ownerRes?.data || null

    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates").select("*").eq("is_default", true).limit(1).maybeSingle()
    if (templateError || !template?.content) {
      return NextResponse.json({ error: "Modèle d'acte de cautionnement introuvable." }, { status: 404 })
    }

    // 2. Construction du contexte et remplissage du template
    const context = buildContext(lease, tenant, owner, guarantor, options || {})
    const htmlContent = fillTemplate(template.content, context)
    
    // 3. Génération du PDF avec Puppeteer et @sparticuz/chromium
    let browser = null
    let pdfBuffer
    try {
      console.log("🚀 Launching browser...")
      
      // Configuration pour Vercel
      const launchOptions = {
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      }
      
      console.log("🔧 Launch options:", launchOptions)
      
      browser = await puppeteer.launch(launchOptions)
      console.log("✅ Browser launched successfully")
      
      const page = await browser.newPage()
      console.log("📄 New page created")
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      console.log("📝 Content set, generating PDF...")
      
      pdfBuffer = await page.pdf({ 
        format: 'A4', 
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      })
      console.log("✅ PDF generated successfully")
      
    } catch (error) {
      console.error("❌ Browser/PDF generation error:", error)
      throw error
    } finally {
      if (browser !== null) {
        console.log("🔒 Closing browser...")
        await browser.close()
        console.log("✅ Browser closed")
      }
    }

    // 4. Envoi du PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="acte-de-cautionnement-${lease.id}.pdf"`,
      },
    })

  } catch (error) {
    console.error("Erreur lors de la génération de l'acte de cautionnement:", error)
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 })
  }
}
