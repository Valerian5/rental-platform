import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { generateRentRevisionPDF } from "@/lib/rent-revision-pdf-generator"

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { revisionId, leaseId, year } = body

    if (!revisionId || !leaseId) {
      return NextResponse.json({ error: "ID de révision et de bail requis" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
      .single()

    if (revisionError || !revision) {
      return NextResponse.json({ error: "Révision non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    if (revision.lease.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Générer le PDF
    const pdf = generateRentRevisionPDF(revision.lease, revision)
    const pdfBuffer = await pdf.output('arraybuffer')
    const buffer = Buffer.from(pdfBuffer)

    return new NextResponse(buffer, {
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
