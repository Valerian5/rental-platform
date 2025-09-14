import { createServerClient } from "./supabase"

interface PropertyData {
  id: string
  rooms: number
  bedrooms: number
  surface: number
  address: string
  city: string
  postal_code: string
}

interface LeaseData {
  locataire_nom_prenom: string
  bailleur_nom_prenom: string
  adresse_logement: string
  date_prise_effet: string
}

interface EtatDesLieuxOptions {
  type: "entree" | "sortie"
  room_count: number
  property_data?: PropertyData
  lease_data: LeaseData
}

export class EtatDesLieuxPDFGenerator {
  private generateHTML(options: EtatDesLieuxOptions): string {
    const { type, room_count, property_data, lease_data } = options

    const roomTypes = {
      1: ["Pièce principale"],
      2: ["Pièce principale", "Chambre"],
      3: ["Pièce principale", "Chambre 1", "Chambre 2"],
      4: ["Pièce principale", "Chambre 1", "Chambre 2", "Chambre 3"],
      5: ["Pièce principale", "Chambre 1", "Chambre 2", "Chambre 3", "Chambre 4"],
    }

    const rooms = roomTypes[room_count as keyof typeof roomTypes] || roomTypes[1]
    const commonRooms = ["Cuisine", "Salle de bains", "WC", "Entrée", "Couloir", "Balcon", "Cave", "Parking"]

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>État des lieux ${type === "entree" ? "d'entrée" : "de sortie"}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #2c3e50;
        }
        .header h2 {
            margin: 10px 0 0 0;
            font-size: 18px;
            color: #7f8c8d;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section h3 {
            background-color: #34495e;
            color: white;
            padding: 10px;
            margin: 0 0 15px 0;
            font-size: 16px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            border: 1px solid #ddd;
            padding: 15px;
            background-color: #f8f9fa;
        }
        .info-item strong {
            display: block;
            margin-bottom: 5px;
            color: #2c3e50;
        }
        .room-section {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            page-break-inside: avoid;
        }
        .room-header {
            background-color: #ecf0f1;
            padding: 10px;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
        }
        .room-content {
            padding: 15px;
        }
        .room-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .room-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .room-item label {
            font-weight: bold;
            min-width: 80px;
        }
        .checkbox-group {
            display: flex;
            gap: 15px;
        }
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .comments {
            margin-top: 15px;
        }
        .comments textarea {
            width: 100%;
            height: 60px;
            border: 1px solid #ddd;
            padding: 10px;
            font-family: Arial, sans-serif;
        }
        .signatures {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        .signature-box {
            border: 1px solid #333;
            height: 80px;
            margin-top: 10px;
        }
        .meter-readings {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .meter-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .meter-item input {
            border: 1px solid #ddd;
            padding: 5px;
            width: 120px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ÉTAT DES LIEUX ${type.toUpperCase()}</h1>
        <h2>${property_data?.address || lease_data.adresse_logement}</h2>
    </div>

    <div class="section">
        <h3>INFORMATIONS GÉNÉRALES</h3>
        <div class="info-grid">
            <div class="info-item">
                <strong>Propriétaire (Bailleur)</strong>
                ${lease_data.bailleur_nom_prenom}
            </div>
            <div class="info-item">
                <strong>Locataire</strong>
                ${lease_data.locataire_nom_prenom}
            </div>
            <div class="info-item">
                <strong>Adresse du logement</strong>
                ${lease_data.adresse_logement}
            </div>
            <div class="info-item">
                <strong>Date de ${type === "entree" ? "prise d'effet" : "sortie"}</strong>
                ${lease_data.date_prise_effet}
            </div>
            <div class="info-item">
                <strong>Date de l'état des lieux</strong>
                ________________
            </div>
            <div class="info-item">
                <strong>Heure</strong>
                ________________
            </div>
        </div>
    </div>

    <div class="section">
        <h3>RELEVÉS DE COMPTEURS</h3>
        <div class="meter-readings">
            <div class="meter-item">
                <label>Électricité :</label>
                <input type="text" placeholder="Relevé">
            </div>
            <div class="meter-item">
                <label>Gaz :</label>
                <input type="text" placeholder="Relevé">
            </div>
            <div class="meter-item">
                <label>Eau froide :</label>
                <input type="text" placeholder="Relevé">
            </div>
            <div class="meter-item">
                <label>Eau chaude :</label>
                <input type="text" placeholder="Relevé">
            </div>
        </div>
    </div>

    <div class="section">
        <h3>NOMBRE DE CLÉS</h3>
        <div class="info-item">
            <strong>Nombre de clés remises :</strong>
            <input type="number" style="border: 1px solid #ddd; padding: 5px; width: 80px; margin-left: 10px;">
        </div>
    </div>

    <div class="section">
        <h3>ÉTAT DES PIÈCES</h3>
        ${rooms.map((room, index) => `
            <div class="room-section">
                <div class="room-header">${room.toUpperCase()}</div>
                <div class="room-content">
                    <div class="room-grid">
                        <div class="room-item">
                            <label>Plafond :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="ceiling-excellent-${index}">
                                    <label for="ceiling-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="ceiling-good-${index}">
                                    <label for="ceiling-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="ceiling-fair-${index}">
                                    <label for="ceiling-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="ceiling-poor-${index}">
                                    <label for="ceiling-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                        <div class="room-item">
                            <label>Murs :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="walls-excellent-${index}">
                                    <label for="walls-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="walls-good-${index}">
                                    <label for="walls-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="walls-fair-${index}">
                                    <label for="walls-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="walls-poor-${index}">
                                    <label for="walls-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                        <div class="room-item">
                            <label>Sol :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="floor-excellent-${index}">
                                    <label for="floor-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="floor-good-${index}">
                                    <label for="floor-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="floor-fair-${index}">
                                    <label for="floor-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="floor-poor-${index}">
                                    <label for="floor-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                        <div class="room-item">
                            <label>Fenêtres :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="windows-excellent-${index}">
                                    <label for="windows-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="windows-good-${index}">
                                    <label for="windows-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="windows-fair-${index}">
                                    <label for="windows-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="windows-poor-${index}">
                                    <label for="windows-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="comments">
                        <label><strong>Commentaires :</strong></label>
                        <textarea placeholder="Observations particulières..."></textarea>
                    </div>
                </div>
            </div>
        `).join("")}

        ${commonRooms.map((room, index) => `
            <div class="room-section">
                <div class="room-header">${room.toUpperCase()}</div>
                <div class="room-content">
                    <div class="room-grid">
                        <div class="room-item">
                            <label>Plafond :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-ceiling-excellent-${index}">
                                    <label for="common-ceiling-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-ceiling-good-${index}">
                                    <label for="common-ceiling-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-ceiling-fair-${index}">
                                    <label for="common-ceiling-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-ceiling-poor-${index}">
                                    <label for="common-ceiling-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                        <div class="room-item">
                            <label>Murs :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-walls-excellent-${index}">
                                    <label for="common-walls-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-walls-good-${index}">
                                    <label for="common-walls-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-walls-fair-${index}">
                                    <label for="common-walls-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-walls-poor-${index}">
                                    <label for="common-walls-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                        <div class="room-item">
                            <label>Sol :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-floor-excellent-${index}">
                                    <label for="common-floor-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-floor-good-${index}">
                                    <label for="common-floor-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-floor-fair-${index}">
                                    <label for="common-floor-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-floor-poor-${index}">
                                    <label for="common-floor-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                        <div class="room-item">
                            <label>Fenêtres :</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-windows-excellent-${index}">
                                    <label for="common-windows-excellent-${index}">Très bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-windows-good-${index}">
                                    <label for="common-windows-good-${index}">Bon état</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-windows-fair-${index}">
                                    <label for="common-windows-fair-${index}">État moyen</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="common-windows-poor-${index}">
                                    <label for="common-windows-poor-${index}">Mauvais état</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="comments">
                        <label><strong>Commentaires :</strong></label>
                        <textarea placeholder="Observations particulières..."></textarea>
                    </div>
                </div>
            </div>
        `).join("")}
    </div>

    <div class="section">
        <h3>SIGNATURES</h3>
        <div class="signatures">
            <div>
                <strong>Propriétaire :</strong>
                <div class="signature-box"></div>
                <p>Date : ________________</p>
            </div>
            <div>
                <strong>Locataire :</strong>
                <div class="signature-box"></div>
                <p>Date : ________________</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>OBSERVATIONS GÉNÉRALES</h3>
        <textarea style="width: 100%; height: 100px; border: 1px solid #ddd; padding: 10px; font-family: Arial, sans-serif;" placeholder="Observations générales sur l'état du logement..."></textarea>
    </div>
</body>
</html>
    `
  }

  async generatePDF(options: EtatDesLieuxOptions): Promise<Buffer> {
    const html = this.generateHTML(options)
    
    // Dans un vrai projet, vous utiliseriez puppeteer ou une autre librairie
    // pour convertir le HTML en PDF. Pour l'instant, on retourne le HTML
    // comme buffer pour simuler un PDF.
    
    return Buffer.from(html, 'utf-8')
  }
}

export const etatDesLieuxPDFGenerator = new EtatDesLieuxPDFGenerator()
