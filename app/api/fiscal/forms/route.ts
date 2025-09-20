import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { FiscalService } from "@/lib/fiscal-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { formType, year } = body

    if (!formType || !year) {
      return NextResponse.json({ 
        success: false, 
        error: "Type de formulaire et année requis" 
      }, { status: 400 })
    }

    // Générer le récapitulatif
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
    
    let pdf
    let filename
    
    if (formType === "2044") {
      pdf = pdfGenerator.generateForm2044(pdfData)
      filename = `formulaire-2044-${year}.pdf`
    } else if (formType === "2042-C-PRO") {
      pdf = pdfGenerator.generateForm2042CPRO(pdfData)
      filename = `formulaire-2042-c-pro-${year}.pdf`
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Type de formulaire non reconnu" 
      }, { status: 400 })
    }
    
    // Convertir en buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error("Erreur génération formulaire:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur génération formulaire" 
    }, { status: 500 })
  }
}
