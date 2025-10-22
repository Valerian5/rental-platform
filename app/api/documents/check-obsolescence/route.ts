import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

// POST /api/documents/check-obsolescence
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient()
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ success: false, error: "userId requis" }, { status: 400 })

    // Récupérer les documents du locataire avec dates d'expiration dans metadata
    const { data: docs, error } = await supabase
      .from('tenant_documents')
      .select('id, title, document_type, metadata, created_at')
      .eq('tenant_id', userId)

    if (error) {
      console.error('❌ [DOC OBS] Erreur récupération docs:', error)
      return NextResponse.json({ success: false, error: 'Erreur base de données' }, { status: 500 })
    }

    const today = new Date()
    const obsoleteDocuments: any[] = []

    // Règles simples (extensibles):
    // - assurance habitation (document_type = 'insurance'): expire à expiry_date; avertir 30j avant
    // - entretien chaudière (document_type = 'boiler_service'): annuel; utiliser expiry_date si présent sinon created_at + 1 an; avertir 30j avant
    for (const d of docs || []) {
      const type = d.document_type
      const expiry = d.metadata?.expiry_date ? new Date(d.metadata.expiry_date) : undefined
      let computedExpiry: Date | undefined = expiry

      if (!computedExpiry) {
        if (type === 'boiler_service') {
          const base = new Date(d.created_at)
          computedExpiry = new Date(base)
          computedExpiry.setFullYear(base.getFullYear() + 1)
        }
      }

      if (!computedExpiry && type === 'insurance') {
        // si pas d'expiry, considérer 1 an après création
        const base = new Date(d.created_at)
        computedExpiry = new Date(base)
        computedExpiry.setFullYear(base.getFullYear() + 1)
      }

      if (!computedExpiry) continue

      const daysDiff = Math.ceil((computedExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 30) {
        obsoleteDocuments.push({
          personType: 'Locataire',
          documentType: type,
          documentName: d.title,
          reason: daysDiff < 0 ? 'Document expiré' : `Document bientôt expiré (${daysDiff} jours)`,
          urgency: daysDiff <= 0 ? 'high' : daysDiff <= 15 ? 'medium' : 'low',
          recommendedAction: 'Veuillez téléverser la nouvelle version du document.',
          category: type === 'insurance' ? 'Assurance' : type === 'boiler_service' ? 'Entretien chaudière' : 'Autre',
        })
      }
    }

    return NextResponse.json({ success: true, obsoleteDocuments })
  } catch (err) {
    console.error('❌ [DOC OBS] Erreur:', err)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}


