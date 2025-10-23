import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { ExpenseInput, ExpenseUpdate } from "@/lib/expense-service-client"

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const propertyId = searchParams.get("property_id")

    // Construire la requête
    let query = supabase
      .from("expenses")
      .select(`
        id,
        property_id,
        lease_id,
        type,
        category,
        amount,
        date,
        description,
        deductible,
        receipt_url,
        created_at,
        updated_at,
        property:properties(
          id,
          title,
          address,
          owner_id
        )
      `)
      .eq("owner_id", user.id)
      .order("date", { ascending: false })

    // Filtrer par année si spécifiée
    if (year) {
      query = query
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`)
    }

    // Filtrer par propriété si spécifiée
    if (propertyId) {
      query = query.eq("property_id", propertyId)
    }

    const { data: expenses, error } = await query

    if (error) {
      console.error("Erreur récupération dépenses:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération dépenses" }, { status: 500 })
    }

    console.log("Dépenses récupérées:", expenses?.length, "première dépense:", expenses?.[0])

    // Si la jointure ne fonctionne pas, récupérer les propriétés séparément
    if (expenses && expenses.length > 0) {
      const propertyIds = [...new Set(expenses.map(exp => exp.property_id).filter(Boolean))]
      
      if (propertyIds.length > 0) {
        const { data: properties, error: propertiesError } = await supabase
          .from("properties")
          .select("id, title, address")
          .in("id", propertyIds)
          .eq("owner_id", user.id)

        if (!propertiesError && properties) {
          // Enrichir les dépenses avec les informations de propriété
          const enrichedExpenses = expenses.map(expense => ({
            ...expense,
            property: properties.find(prop => prop.id === expense.property_id) || null
          }))
          
          console.log("Dépenses enrichies:", enrichedExpenses?.[0])
          return NextResponse.json({ success: true, data: enrichedExpenses })
        }
      }
    }

    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    console.error("Erreur API dépenses:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const body: ExpenseInput = await request.json()

    // Validation des données
    if (!body.property_id || !body.type || !body.category || !body.amount || !body.date || !body.description) {
      return NextResponse.json({ 
        success: false, 
        error: "Données manquantes" 
      }, { status: 400 })
    }

    // Vérifier que la propriété appartient au propriétaire
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, owner_id")
      .eq("id", body.property_id)
      .single()

    if (propertyError || !property || property.owner_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Propriété non trouvée ou non autorisée" 
      }, { status: 403 })
    }

    // Vérifier que le bail appartient au propriétaire (si spécifié)
    if (body.lease_id) {
      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select("id, owner_id")
        .eq("id", body.lease_id)
        .single()

      if (leaseError || !lease || lease.owner_id !== user.id) {
        return NextResponse.json({ 
          success: false, 
          error: "Bail non trouvé ou non autorisé" 
        }, { status: 403 })
      }
    }

    // Créer la dépense
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        owner_id: user.id,
        property_id: body.property_id,
        lease_id: body.lease_id || null,
        type: body.type,
        category: body.category,
        amount: body.amount,
        date: body.date,
        description: body.description,
        deductible: body.deductible ?? true,
        receipt_url: body.receipt_url || null
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création dépense:", error)
      return NextResponse.json({ success: false, error: "Erreur création dépense" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error("Erreur API création dépense:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const body: ExpenseUpdate = await request.json()

    if (!body.id) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de dépense manquant" 
      }, { status: 400 })
    }

    // Vérifier que la dépense appartient au propriétaire
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("id, owner_id")
      .eq("id", body.id)
      .single()

    if (fetchError || !existingExpense || existingExpense.owner_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Dépense non trouvée ou non autorisée" 
      }, { status: 403 })
    }

    // Vérifier la propriété si elle est modifiée
    if (body.property_id) {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, owner_id")
        .eq("id", body.property_id)
        .single()

      if (propertyError || !property || property.owner_id !== user.id) {
        return NextResponse.json({ 
          success: false, 
          error: "Propriété non trouvée ou non autorisée" 
        }, { status: 403 })
      }
    }

    // Vérifier le bail si il est modifié
    if (body.lease_id) {
      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select("id, owner_id")
        .eq("id", body.lease_id)
        .single()

      if (leaseError || !lease || lease.owner_id !== user.id) {
        return NextResponse.json({ 
          success: false, 
          error: "Bail non trouvé ou non autorisé" 
        }, { status: 403 })
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}
    if (body.property_id) updateData.property_id = body.property_id
    if (body.lease_id !== undefined) updateData.lease_id = body.lease_id
    if (body.type) updateData.type = body.type
    if (body.category) updateData.category = body.category
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.date) updateData.date = body.date
    if (body.description) updateData.description = body.description
    if (body.deductible !== undefined) updateData.deductible = body.deductible
    if (body.receipt_url !== undefined) updateData.receipt_url = body.receipt_url

    updateData.updated_at = new Date().toISOString()

    // Mettre à jour la dépense
    const { data: expense, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour dépense:", error)
      return NextResponse.json({ success: false, error: "Erreur mise à jour dépense" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error("Erreur API mise à jour dépense:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const expenseId = searchParams.get("id")

    if (!expenseId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de dépense manquant" 
      }, { status: 400 })
    }

    // Vérifier que la dépense appartient au propriétaire
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("id, owner_id")
      .eq("id", expenseId)
      .single()

    if (fetchError || !existingExpense || existingExpense.owner_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Dépense non trouvée ou non autorisée" 
      }, { status: 403 })
    }

    // Supprimer la dépense
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)

    if (error) {
      console.error("Erreur suppression dépense:", error)
      return NextResponse.json({ success: false, error: "Erreur suppression dépense" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur API suppression dépense:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}