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

    const { data: expense, error } = await supabase
      .from("expenses")
      .select(`
        *,
        property:properties(title, address),
        lease:leases(
          property:properties(title, address),
          tenant:users!leases_tenant_id_fkey(first_name, last_name)
        )
      `)
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ success: false, error: "Dépense non trouvée" }, { status: 404 })
      }
      console.error("Erreur récupération dépense:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération dépense" }, { status: 500 })
    }

    return NextResponse.json({ success: true, expense })

  } catch (error) {
    console.error("Erreur API dépense GET:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(
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

    const body = await request.json()
    const {
      type,
      category,
      amount,
      date,
      description,
      receipt_url
    } = body

    // Validation des données
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Le montant doit être positif" 
      }, { status: 400 })
    }

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (category !== undefined) {
      updateData.category = category
      updateData.deductible = category !== "improvement"
    }
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (date !== undefined) updateData.date = date
    if (description !== undefined) updateData.description = description
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url

    const { data: expense, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .select(`
        *,
        property:properties(title, address),
        lease:leases(
          property:properties(title, address),
          tenant:users!leases_tenant_id_fkey(first_name, last_name)
        )
      `)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ success: false, error: "Dépense non trouvée" }, { status: 404 })
      }
      console.error("Erreur mise à jour dépense:", error)
      return NextResponse.json({ success: false, error: "Erreur mise à jour dépense" }, { status: 500 })
    }

    return NextResponse.json({ success: true, expense })

  } catch (error) {
    console.error("Erreur API dépense PUT:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", params.id)
      .eq("owner_id", user.id)

    if (error) {
      console.error("Erreur suppression dépense:", error)
      return NextResponse.json({ success: false, error: "Erreur suppression dépense" }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Erreur API dépense DELETE:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
