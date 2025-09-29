import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { type = "entree" } = await request.json()
    const server = createServerClient()

    // Récupérer le document d'état des lieux
    const { data: document, error: documentError } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", type)
      .single()

    if (documentError || !document) {
      return NextResponse.json({ error: "Document d'état des lieux non trouvé" }, { status: 404 })
    }

    // Récupérer les infos du bail
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!leases_tenant_id_fkey(*),
        owner:users!leases_owner_id_fkey(*)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Générer le PDF
    const { generateEtatDesLieuxPDF } = await import("@/lib/etat-des-lieux-pdf-generator")
    const pdf = generateEtatDesLieuxPDF(lease, document)
    
    // Convertir en buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etat-des-lieux-${type}-${leaseId}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erreur génération PDF état des lieux:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la génération du PDF" 
    }, { status: 500 })
  }
}
