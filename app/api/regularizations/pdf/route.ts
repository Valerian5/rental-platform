import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServerClient } from '@/lib/supabase'
import { generateChargeRegularizationPDFBlob } from '@/lib/charge-regularization-pdf-generator'

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Utiliser le même client que le côté client, mais avec le token utilisateur
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { regularizationId, leaseId, year } = body

    if (!regularizationId || !leaseId || !year) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const supabaseAdmin = createServerClient()

    // Récupérer les données complètes
    const { data: regularization, error: regularizationError } = await supabaseAdmin
      .from('charge_regularizations_v2')
      .select(`
        *,
        expenses:charge_expenses(
          *,
          supporting_documents:charge_supporting_documents(*)
        )
      `)
      .eq('id', regularizationId)
      .eq('created_by', user.id)
      .single()

    if (regularizationError || !regularization) {
      console.log('Régularisation non trouvée:', regularizationError)
      return NextResponse.json({ error: "Régularisation non trouvée" }, { status: 404 })
    }

    const { data: lease, error: leaseError } = await supabaseAdmin
      .from('leases')
      .select(`
        *,
        property:properties(
          title,
          address,
          city
        ),
        tenant:users!leases_tenant_id_fkey(
          first_name,
          last_name,
          email
        ),
        owner:users!leases_owner_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', leaseId)
      .single()

    if (leaseError || !lease) {
      console.log('Bail non trouvé:', leaseError)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    if (lease.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Générer le PDF
    const { generateChargeRegularizationPDF } = await import('@/lib/charge-regularization-pdf-generator')
    const pdf = generateChargeRegularizationPDF(lease, regularization)
    
    // Convertir en buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="regularisation-charges-${year}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
