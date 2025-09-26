import { NextRequest, NextResponse } from "next/server"
import { createClient, createServerClient } from "@/lib/supabase"

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
    const { revisionId, leaseId, year } = body

    console.log('🔍 PDF Révision - Paramètres reçus:', { revisionId, leaseId, year, userId: user.id })

    if (!revisionId || !leaseId) {
      return NextResponse.json({ error: "ID de révision et de bail requis" }, { status: 400 })
    }

    const supabaseAdmin = createServerClient()

    // Récupérer les données complètes
    const { data: revision, error: revisionError } = await supabaseAdmin
      .from('lease_revisions')
      .select(`
        *,
        lease:leases(
          *,
          property:properties(*),
          tenant:users!leases_tenant_id_fkey(*),
          owner:users!leases_owner_id_fkey(*)
        )
      `)
      .eq('id', revisionId)
      .eq('created_by', user.id)
      .single()

    if (revisionError || !revision) {
      console.error('❌ PDF Révision - Erreur récupération:', revisionError)
      return NextResponse.json({ error: "Révision non trouvée" }, { status: 404 })
    }

    console.log('✅ PDF Révision - Révision trouvée:', revision.id)

    // Vérifier que l'utilisateur est propriétaire
    if (revision.lease.owner_id !== user.id) {
      console.error('❌ PDF Révision - Utilisateur non autorisé:', { 
        revisionOwner: revision.lease.owner_id, 
        currentUser: user.id 
      })
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Générer le PDF
    const { generateRentRevisionPDF } = await import('@/lib/rent-revision-pdf-generator')
    const pdf = generateRentRevisionPDF(revision.lease, revision)
    
    // Convertir en buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="revision-loyer-${year}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erreur génération PDF révision:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la génération du PDF" 
    }, { status: 500 })
  }
}
