import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const workId = params.id
    const body = await request.json()

    // Vérifier que le travail appartient au propriétaire
    const { data: work, error: workError } = await supabase
      .from("maintenance_works")
      .select(`
        id,
        property_id,
        property:properties!inner(
          id,
          owner_id
        )
      `)
      .eq("id", workId)
      .single()

    if (workError || !work || work.property.owner_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Travail non trouvé ou non autorisé" 
      }, { status: 403 })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}
    if (body.title) updateData.title = body.title
    if (body.description) updateData.description = body.description
    if (body.type) updateData.type = body.type
    if (body.category) updateData.category = body.category
    if (body.scheduled_date) updateData.scheduled_date = body.scheduled_date
    if (body.cost !== undefined) updateData.cost = body.cost
    if (body.estimated_cost !== undefined) updateData.estimated_cost = body.estimated_cost
    if (body.provider_name !== undefined) updateData.provider_name = body.provider_name
    if (body.provider_contact !== undefined) updateData.provider_contact = body.provider_contact
    if (body.status) updateData.status = body.status
    if (body.completed_date) updateData.completed_date = body.completed_date

    updateData.updated_at = new Date().toISOString()

    // Mettre à jour le travail
    const { data: updatedWork, error } = await supabase
      .from("maintenance_works")
      .update(updateData)
      .eq("id", workId)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour travail:", error)
      return NextResponse.json({ success: false, error: "Erreur mise à jour travail" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedWork })
  } catch (error) {
    console.error("Erreur API mise à jour travail:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const workId = params.id

    // Vérifier que le travail appartient au propriétaire
    const { data: work, error: workError } = await supabase
      .from("maintenance_works")
      .select(`
        id,
        property_id,
        property:properties!inner(
          id,
          owner_id
        )
      `)
      .eq("id", workId)
      .single()

    if (workError || !work || work.property.owner_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Travail non trouvé ou non autorisé" 
      }, { status: 403 })
    }

    // Supprimer le travail
    const { error } = await supabase
      .from("maintenance_works")
      .delete()
      .eq("id", workId)

    if (error) {
      console.error("Erreur suppression travail:", error)
      return NextResponse.json({ success: false, error: "Erreur suppression travail" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur API suppression travail:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}
