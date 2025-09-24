import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { FiscalServiceClient } from "@/lib/fiscal-service-client"

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec le token utilisateur pour respecter RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const body = await request.json()
    const { formType, year } = body

    if (!formType || !year) {
      return NextResponse.json({ 
        success: false, 
        error: "Type de formulaire et année requis" 
      }, { status: 400 })
    }

    // Générer le formulaire avec les données fiscales réelles
    const fiscalData = await FiscalServiceClient.generateFiscalSummary(user.id, year)
    const pdfContent = generateFormPDF(formType, year, user, fiscalData)

    return new NextResponse(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="formulaire-${formType}-${year}.pdf"`
      }
    })
  } catch (error) {
    console.error("Erreur génération formulaire:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

function generateFormPDF(formType: string, year: number, user: any, fiscalData: any): Buffer {
  // Générer un PDF avec les données fiscales réelles
  const content = `
    Formulaire ${formType} - Année ${year}
    Propriétaire: ${user.first_name} ${user.last_name}
    Email: ${user.email}
    
    Données fiscales:
    - Revenus bruts: ${fiscalData.summary?.totalRentCollected || 0} €
    - Charges récupérables: ${fiscalData.summary?.totalRecoverableCharges || 0} €
    - Dépenses déductibles: ${fiscalData.summary?.totalDeductibleExpenses || 0} €
    - Revenu net: ${fiscalData.summary?.netRentalIncome || 0} €
    - Bénéfice imposable: ${fiscalData.summary?.taxableProfit || 0} €
    
    Nombre de quittances: ${fiscalData.receipts?.length || 0}
    Nombre de dépenses: ${fiscalData.expenses?.deductible?.length + fiscalData.expenses?.nonDeductible?.length || 0}
  `
  
  // Convertir en Buffer (simulation)
  return Buffer.from(content, 'utf-8')
}