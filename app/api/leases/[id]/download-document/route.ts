import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 Download document request for lease:", params.id)
    
    const leaseId = params.id
    const server = createServerClient()

    // Récupérer le bail
    console.log("📄 Fetching lease data...")
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, generated_document")
      .eq("id", leaseId)
      .single()

    if (leaseError) {
      console.error("❌ Lease error:", leaseError)
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    if (!lease) {
      console.error("❌ No lease found")
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    // Récupérer les données complètes du bail pour génération PDF
    console.log("📄 Fetching complete lease data...")
    const { data: fullLease, error: fullLeaseError } = await server
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!leases_tenant_id_fkey(*),
        owner:users!leases_owner_id_fkey(*)
      `)
      .eq("id", leaseId)
      .single()

    if (fullLeaseError || !fullLease) {
      console.error("❌ Full lease error:", fullLeaseError)
      return NextResponse.json({ error: "Données du bail introuvables" }, { status: 404 })
    }

    // Générer le HTML du bail
    console.log("📝 Generating lease HTML...")
    const htmlContent = generateLeaseHTML(fullLease)

    // Générer le PDF avec Puppeteer
    console.log("🔄 Generating PDF...")
    let browser = null
    let pdfBuffer
    try {
      browser = await puppeteer.launch({
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
      })
      
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      
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
      
    } catch (error) {
      console.error("❌ PDF generation error:", error)
      throw error
    } finally {
      if (browser !== null) {
        await browser.close()
      }
    }

    console.log("✅ Successfully generated PDF")

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bail-${leaseId}.pdf"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("❌ Erreur téléchargement document:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Fonction pour générer le HTML du bail
function generateLeaseHTML(lease: any) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bail de location</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          background-color: #f5f5f5;
          padding: 10px;
          margin: 0 0 15px 0;
          border-left: 4px solid #007bff;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
        }
        .signature-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .signature-box {
          border: 1px solid #ccc;
          height: 80px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BAIL DE LOCATION</h1>
        <p>Bail n° ${lease.id.slice(0, 8)}</p>
      </div>

      <div class="section">
        <h2>1. PARTIES</h2>
        <div class="info-grid">
          <div>
            <h3>Bailleur</h3>
            <div class="info-item">
              <span class="info-label">Nom :</span> ${lease.owner?.first_name || ''} ${lease.owner?.last_name || ''}
            </div>
            <div class="info-item">
              <span class="info-label">Adresse :</span> ${lease.bailleur_adresse || ''}
            </div>
          </div>
          <div>
            <h3>Locataire</h3>
            <div class="info-item">
              <span class="info-label">Nom :</span> ${lease.locataire_nom_prenom || ''}
            </div>
            <div class="info-item">
              <span class="info-label">Adresse :</span> ${lease.locataire_adresse || ''}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>2. BIEN LOUÉ</h2>
        <div class="info-item">
          <span class="info-label">Adresse :</span> ${lease.adresse_logement || ''}
        </div>
        <div class="info-item">
          <span class="info-label">Type :</span> ${lease.lease_type === 'unfurnished' ? 'Logement vide' : lease.lease_type === 'furnished' ? 'Logement meublé' : 'Local commercial'}
        </div>
        ${lease.property ? `
        <div class="info-item">
          <span class="info-label">Surface :</span> ${lease.property.surface || ''} m²
        </div>
        <div class="info-item">
          <span class="info-label">Pièces :</span> ${lease.property.rooms || ''}
        </div>
        ` : ''}
      </div>

      <div class="section">
        <h2>3. CONDITIONS DE LOCATION</h2>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Loyer mensuel :</span> ${formatCurrency(lease.montant_loyer_mensuel || 0)}
            </div>
            <div class="info-item">
              <span class="info-label">Charges :</span> ${formatCurrency(lease.charges || 0)}
            </div>
            <div class="info-item">
              <span class="info-label">Dépôt de garantie :</span> ${formatCurrency(lease.depot_garantie || 0)}
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Date de prise d'effet :</span> ${formatDate(lease.date_prise_effet || '')}
            </div>
            <div class="info-item">
              <span class="info-label">Durée :</span> ${lease.duree_contrat || ''} mois
            </div>
            <div class="info-item">
              <span class="info-label">Date de fin :</span> ${lease.date_fin ? formatDate(lease.date_fin) : 'Non définie'}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>4. SIGNATURES</h2>
        <div class="signature-section">
          <div>
            <p><strong>Le Bailleur</strong></p>
            <div class="signature-box"></div>
            <p>Date : _______________</p>
          </div>
          <div>
            <p><strong>Le Locataire</strong></p>
            <div class="signature-box"></div>
            <p>Date : _______________</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </body>
    </html>
  `
}
