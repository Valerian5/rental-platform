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

    // Générer le récapitulatif avec le client authentifié
    const summary = await FiscalServiceClient.generateFiscalSummary(user.id, year, supabase)
    
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
    
    // Retourner les données pour génération côté client
    return NextResponse.json({ 
      success: true, 
      data: pdfData,
      formType,
      year 
    })

  } catch (error) {
    console.error("Erreur génération formulaire:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur génération formulaire" 
    }, { status: 500 })
  }
}