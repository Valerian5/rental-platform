import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const propertyId = searchParams.get("property_id")
    const leaseId = searchParams.get("lease_id")
    const category = searchParams.get("category")
    const deductible = searchParams.get("deductible")

    let query = supabase
      .from("expenses")
      .select(`
        *,
        property:properties(title, address),
        lease:leases(
          property:properties(title, address),
          tenant:users!leases_tenant_id_fkey(first_name, last_name)
        )
      `)
      .eq("owner_id", user.id)
      .order("date", { ascending: false })

    if (year) {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      query = query.gte("date", startDate).lte("date", endDate)
    }

    if (propertyId) {
      query = query.eq("property_id", propertyId)
    }

    if (leaseId) {
      query = query.eq("lease_id", leaseId)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (deductible !== null) {
      query = query.eq("deductible", deductible === "true")
    }

    const { data: expenses, error } = await query

    if (error) {
      console.error("Erreur récupération dépenses:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération dépenses" }, { status: 500 })
    }

    return NextResponse.json({ success: true, expenses: expenses || [] })

  } catch (error) {
    console.error("Erreur API dépenses GET:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const {
      property_id,
      lease_id,
      type,
      category,
      amount,
      date,
      description,
      receipt_url
    } = body

    // Validation des données
    if (!property_id || !type || !category || !amount || !date || !description) {
      return NextResponse.json({ 
        success: false, 
        error: "Données manquantes" 
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Le montant doit être positif" 
      }, { status: 400 })
    }

    // Déterminer si la dépense est déductible
    const deductible = category !== "improvement"

    const expenseData = {
      owner_id: user.id,
      property_id,
      lease_id: lease_id || null,
      type,
      category,
      amount: parseFloat(amount),
      date,
      description,
      deductible,
      receipt_url: receipt_url || null
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert(expenseData)
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
      console.error("Erreur création dépense:", error)
      return NextResponse.json({ success: false, error: "Erreur création dépense" }, { status: 500 })
    }

    return NextResponse.json({ success: true, expense })

  } catch (error) {
    console.error("Erreur API dépenses POST:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
