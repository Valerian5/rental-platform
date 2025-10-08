import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

// GET: Récupérer les provisions de charges
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

    // Récupérer les provisions avec les régularisations associées
    const { data: provisions } = await supabase
      .from("charge_provisions")
      .select(`
        *,
        regularization:charge_regularizations_v2(*)
      `)
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })

    return NextResponse.json({ provisions })
  } catch (error) {
    console.error("Erreur récupération provisions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST: Créer une nouvelle provision de charges
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
      provisionAmount,
      justificationNotes,
      expectedFinalizationDate,
      supportingDocuments = []
    } = body

    // Vérifier les droits (propriétaire uniquement)
    const { data: lease } = await supabase
      .from("leases")
      .select("id, owner_id, deposit_amount, deposit, security_deposit, depot_garantie")
      .eq("id", leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    // Calculer le dépôt de garantie
    const depositAmount = Number(
      lease.deposit_amount ?? 
      lease.deposit ?? 
      lease.security_deposit ?? 
      lease.depot_garantie ?? 
      0
    )

    const maxAllowedAmount = depositAmount * 0.2

    if (provisionAmount > maxAllowedAmount) {
      return NextResponse.json({ 
        error: `La provision ne peut pas dépasser 20% du dépôt (${maxAllowedAmount.toFixed(2)}€)` 
      }, { status: 400 })
    }

    // Vérifier qu'il n'y a pas déjà une provision active
    const { data: existingProvision } = await supabase
      .from("charge_provisions")
      .select("id")
      .eq("lease_id", leaseId)
      .eq("status", "active")
      .single()

    if (existingProvision) {
      return NextResponse.json({ 
        error: "Une provision de charges est déjà active pour ce bail" 
      }, { status: 400 })
    }

    // Créer la provision
    const { data: newProvision, error: insertError } = await supabase
      .from("charge_provisions")
      .insert({
        lease_id: leaseId,
        provision_amount: provisionAmount,
        max_allowed_amount: maxAllowedAmount,
        deposit_amount: depositAmount,
        supporting_documents: supportingDocuments,
        justification_notes: justificationNotes,
        provision_date: new Date().toISOString().split('T')[0],
        expected_finalization_date: expectedFinalizationDate,
        status: 'active',
        created_by: user.id
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Erreur création provision:", insertError)
      return NextResponse.json({ error: "Erreur création provision" }, { status: 500 })
    }

    // Notifier le locataire
    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(lease.tenant_id, {
        type: 'charge_provision_created',
        title: 'Provision de charges retenue',
        content: `Une provision de ${provisionAmount.toFixed(2)}€ a été retenue sur votre dépôt de garantie en attente de la régularisation des charges.`,
        action_url: `/tenant/leases/${leaseId}`,
        metadata: { 
          lease_id: leaseId, 
          provision_id: newProvision.id,
          provision_amount: provisionAmount
        }
      })
    } catch (e) {
      console.warn('Notification locataire (création provision) échouée:', e)
    }

    return NextResponse.json({ 
      success: true, 
      provisionId: newProvision.id 
    })
  } catch (error) {
    console.error("Erreur création provision:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
