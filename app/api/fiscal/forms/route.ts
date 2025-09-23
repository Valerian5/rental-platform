import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

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

    // Pour l'instant, générer un PDF simple avec les informations de base
    // Dans une vraie implémentation, vous utiliseriez une bibliothèque comme jsPDF ou PDFKit
    const pdfContent = generateFormPDF(formType, year, user)

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

function generateFormPDF(formType: string, year: number, user: any): Buffer {
  // Pour l'instant, retourner un PDF simple
  // Dans une vraie implémentation, vous généreriez un vrai PDF
  const content = `
    Formulaire ${formType} - Année ${year}
    Propriétaire: ${user.first_name} ${user.last_name}
    Email: ${user.email}
    
    Ceci est un exemple de formulaire fiscal.
    Dans une implémentation complète, ceci serait un vrai PDF.
  `
  
  // Convertir en Buffer (simulation)
  return Buffer.from(content, 'utf-8')
}