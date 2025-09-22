import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { FiscalService } from "@/lib/fiscal-service"

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec le token
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const action = searchParams.get("action") || "calculate"
    const propertyId = searchParams.get("property_id")

    if (action === "calculate") {
      // Calculer les données fiscales
      const calculation = await FiscalService.calculateFiscalData(user.id, year, propertyId)
      return NextResponse.json({ success: true, data: calculation })
    }

    if (action === "stats") {
      // Récupérer les statistiques
      const stats = await FiscalService.getFiscalStats(user.id)
      return NextResponse.json({ success: true, data: stats })
    }

    if (action === "years") {
      // Récupérer les années disponibles
      const years = await FiscalService.getAvailableYears(user.id)
      return NextResponse.json({ success: true, data: years })
    }

    if (action === "summary") {
      // Générer le récapitulatif
      const summary = await FiscalService.generateFiscalSummary(user.id, year)
      return NextResponse.json({ success: true, data: summary })
    }

    return NextResponse.json({ success: false, error: "Action non reconnue" }, { status: 400 })

  } catch (error) {
    console.error("Erreur API fiscale:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec le token
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const body = await request.json()
    const { action, year } = body

    if (action === "export-csv") {
      // Exporter en CSV
      const csvData = await FiscalService.exportFiscalDataCSV(user.id, year)
      
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="declaration-fiscale-${year}.csv"`
        }
      })
    }

    if (action === "export-pdf") {
      // Générer le récapitulatif PDF
      const summary = await FiscalService.generateFiscalSummary(user.id, year)
      
      // Créer les données pour le PDF
      const pdfData = {
        year,
        owner: {
          name: user.user_metadata?.full_name || "Propriétaire",
          address: user.user_metadata?.address || "Adresse non renseignée",
          email: user.email || ""
        },
        summary: summary.summary,
        simulations: summary.simulations,
        expenses: summary.expenses,
        properties: summary.properties
      }
      
      // Importer le générateur PDF
      const { FiscalPDFGenerator } = await import("@/lib/fiscal-pdf-generator")
      const pdfGenerator = new FiscalPDFGenerator()
      const pdf = pdfGenerator.generateFiscalSummary(pdfData)
      
      // Convertir en buffer
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="declaration-fiscale-${year}.pdf"`
        }
      })
    }

    return NextResponse.json({ success: false, error: "Action non reconnue" }, { status: 400 })

  } catch (error) {
    console.error("Erreur API fiscale POST:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}
