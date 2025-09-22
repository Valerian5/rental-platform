import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const receiptId = params.id

    // Récupérer les données de la quittance
    const { data: receipt, error } = await supabase
      .from('receipts')
      .select(`
        *,
        payment:payments!receipts_payment_id_fkey(
          *,
          lease:leases!payments_lease_id_fkey(
            *,
            property:properties!leases_property_id_fkey(*),
            tenant:users!leases_tenant_id_fkey(*)
          )
        )
      `)
      .eq('id', receiptId)
      .single()

    if (error || !receipt) {
      console.error('Erreur récupération quittance:', error)
      return NextResponse.json({ success: false, error: "Quittance non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (receipt.payment.lease.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    // Créer les données pour le PDF
    const pdfData = {
      id: receipt.id,
      reference: receipt.reference,
      month: receipt.month,
      year: receipt.year,
      rent_amount: receipt.rent_amount,
      charges_amount: receipt.charges_amount,
      total_amount: receipt.total_amount,
      generated_at: receipt.generated_at,
      payment: {
        id: receipt.payment.id,
        month_name: receipt.payment.month_name,
        due_date: receipt.payment.due_date,
        payment_date: receipt.payment.payment_date,
        payment_method: receipt.payment.payment_method,
        lease: {
          id: receipt.payment.lease.id,
          monthly_rent: receipt.payment.lease.monthly_rent,
          charges: receipt.payment.lease.charges,
          property: {
            title: receipt.payment.lease.property.title,
            address: receipt.payment.lease.property.address
          },
          tenant: {
            first_name: receipt.payment.lease.tenant.first_name,
            last_name: receipt.payment.lease.tenant.last_name,
            email: receipt.payment.lease.tenant.email
          }
        }
      }
    }
    
    // Importer le générateur PDF
    const { PDFGenerator } = await import("@/lib/pdf-generator")
    const pdf = PDFGenerator.generateReceiptPDF(pdfData)
    
    // Convertir en buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Générer le nom de fichier
    const filename = PDFGenerator.generateReceiptFilename(pdfData)
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error("Erreur génération quittance PDF:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur génération quittance PDF" 
    }, { status: 500 })
  }
}
