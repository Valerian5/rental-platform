import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

// GET: Récupérer les retenues existantes
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const supabase = hasBearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : createServerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    // Vérifier les droits sur le bail
    const { data: lease } = await supabase
      .from("leases")
      .select("id, owner_id, tenant_id")
      .eq("id", leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id && lease.tenant_id !== user.id) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    // Récupérer les retenues avec les lignes
    const { data: retention } = await supabase
      .from("deposit_retentions")
      .select(`
        *,
        lines:deposit_retention_lines(*),
        provisions:charge_provisions(*)
      `)
      .eq("lease_id", leaseId)
      .single()

    return NextResponse.json({ retention })
  } catch (error) {
    console.error("Erreur récupération retenues:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST: Créer ou mettre à jour les retenues
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const supabase = hasBearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : createServerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const body = await request.json()
    const {
      depositAmount,
      moveOutDate,
      restitutionDeadlineDays,
      bankIban,
      bankBic,
      lines = [],
      provisionalCharges = null
    } = body

    // Vérifier les droits (propriétaire uniquement)
    const { data: lease } = await supabase
      .from("leases")
      .select("id, owner_id, property_id")
      .eq("id", leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    const totalRetained = lines.reduce((sum: number, line: any) => sum + (line.amount || 0), 0)
    const amountToRefund = Math.max(0, depositAmount - totalRetained)

    // Créer ou mettre à jour la retenue principale
    const retentionData = {
      lease_id: leaseId,
      deposit_amount: depositAmount,
      total_retained: totalRetained,
      amount_to_refund: amountToRefund,
      move_out_date: moveOutDate,
      restitution_deadline_days: restitutionDeadlineDays || 30,
      bank_iban: bankIban,
      bank_bic: bankBic,
      status: lines.length > 0 ? 'calculated' : 'draft',
      created_by: user.id
    }

    const { data: existingRetention } = await supabase
      .from("deposit_retentions")
      .select("id")
      .eq("lease_id", leaseId)
      .single()

    let retentionId: string

    if (existingRetention) {
      // Mettre à jour
      const { error: updateError } = await supabase
        .from("deposit_retentions")
        .update(retentionData)
        .eq("id", existingRetention.id)
      if (updateError) throw updateError
      retentionId = existingRetention.id
    } else {
      // Créer
      const { data: newRetention, error: insertError } = await supabase
        .from("deposit_retentions")
        .insert(retentionData)
        .select("id")
        .single()
      if (insertError) throw insertError
      retentionId = newRetention.id
    }

    // Supprimer les anciennes lignes
    await supabase
      .from("deposit_retention_lines")
      .delete()
      .eq("retention_id", retentionId)

    // Créer les nouvelles lignes
    if (lines.length > 0) {
      const linesData = lines.map((line: any) => ({
        retention_id: retentionId,
        category: line.category,
        description: line.description,
        amount: line.amount,
        attachment_url: line.attachmentUrl,
        attachment_name: line.attachmentName,
        is_provisional: line.category === 'provisional_charges',
        provisional_max_amount: line.category === 'provisional_charges' ? depositAmount * 0.2 : null
      }))

      const { error: linesError } = await supabase
        .from("deposit_retention_lines")
        .insert(linesData)
      if (linesError) throw linesError
    }

    // Gérer les provisions de charges si spécifiées
    if (provisionalCharges && provisionalCharges.amount > 0) {
      const maxAllowed = depositAmount * 0.2
      if (provisionalCharges.amount > maxAllowed) {
        return NextResponse.json({ 
          error: `La provision ne peut pas dépasser 20% du dépôt (${maxAllowed.toFixed(2)}€)` 
        }, { status: 400 })
      }

      // Vérifier s'il existe déjà une provision active
      const { data: existingProvision } = await supabase
        .from("charge_provisions")
        .select("id")
        .eq("lease_id", leaseId)
        .eq("status", "active")
        .single()

      const provisionData = {
        lease_id: leaseId,
        retention_id: retentionId,
        provision_amount: provisionalCharges.amount,
        max_allowed_amount: maxAllowed,
        deposit_amount: depositAmount,
        supporting_documents: provisionalCharges.supportingDocuments || [],
        justification_notes: provisionalCharges.justificationNotes,
        provision_date: new Date().toISOString().split('T')[0],
        expected_finalization_date: provisionalCharges.expectedFinalizationDate,
        status: 'active',
        created_by: user.id
      }

      if (existingProvision) {
        // Mettre à jour
        await supabase
          .from("charge_provisions")
          .update(provisionData)
          .eq("id", existingProvision.id)
      } else {
        // Créer
        await supabase
          .from("charge_provisions")
          .insert(provisionData)
      }
    }

    return NextResponse.json({ success: true, retentionId })
  } catch (error) {
    console.error("Erreur sauvegarde retenues:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
