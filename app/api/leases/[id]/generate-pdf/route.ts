import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = params.id
    const server = createServerClient()

    // Récupérer le bail avec toutes les informations nécessaires
    const { data: lease, error } = await server
      .from("leases")
      .select(`
        *,
        property:property_id(*),
        owner:owner_id(*),
        tenant:tenant_id(*)
      `)
      .eq("id", leaseId)
      .single()

    if (error || !lease) {
      console.error("❌ Bail non trouvé:", error)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Générer le HTML du bail
    const htmlContent = generateLeaseHTML(lease)

    // Retourner le HTML pour l'impression côté client
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("❌ Erreur génération PDF:", error)
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
        @media print {
          @page { size: A4; margin: 1cm; }
          body { margin: 0; padding: 0; }
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
