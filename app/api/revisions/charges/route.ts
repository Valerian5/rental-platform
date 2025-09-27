import { NextRequest, NextResponse } from "next/server"
import { supabase, createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'utilisateur depuis les headers ou le token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const year = searchParams.get('year')

    const supabaseAdmin = createServerClient()
    
    let query = supabaseAdmin
      .from('charge_regularizations_v2')
      .select(`
        *,
        lease:leases(
          id,
          tenant_id,
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          property:properties(
            id,
            title,
            address,
            city
          )
        ),
        expenses:charge_expenses(
          *,
          supporting_documents:charge_supporting_documents(*)
        )
      `)
      .eq('created_by', user.id)

    if (propertyId) {
      // Pour la table v2, on doit joindre via lease
      query = query.eq('lease.property_id', propertyId)
    }

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    const { data: regularizations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error("Erreur récupération régularisations:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    return NextResponse.json({ success: true, regularizations })
  } catch (error) {
    console.error("Erreur API régularisations:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API POST /api/revisions/charges appelée')
  try {
    // Récupérer l'utilisateur depuis les headers ou le token
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Auth header reçu:', authHeader ? 'Oui' : 'Non')
    
    if (!authHeader) {
      console.log('❌ Token d\'authentification manquant')
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Token extrait:', token ? 'Oui' : 'Non')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    console.log('👤 Utilisateur authentifié:', user ? 'Oui' : 'Non')
    console.log('❌ Erreur auth:', userError)
    
    if (userError || !user) {
      console.log('❌ Échec de l\'authentification')
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    console.log('📥 Body reçu par l\'API:', body)
    
    const { 
      leaseId, 
      propertyId, 
      regularizationYear,
      totalProvisionsCollected,
      totalRealCharges,
      recoverableCharges,
      tenantBalance,
      balanceType,
      calculationMethod,
      calculationNotes,
      chargeBreakdown
    } = body

    const supabaseAdmin = createServerClient()
    
    // Vérifier que l'utilisateur est propriétaire du bail
    const { data: lease, error: leaseError } = await supabaseAdmin
      .from('leases')
      .select('id, property_id, property:properties(owner_id)')
      .eq('id', leaseId)
      .single()

    if (leaseError || !lease || lease.property.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Vérifier si une régularisation existe déjà pour ce bail et cette année
    const { data: existingRegularization, error: checkError } = await supabaseAdmin
      .from('charge_regularizations_v2')
      .select('id')
      .eq('lease_id', leaseId)
      .eq('year', regularizationYear)
      .single()

    let regularization

    if (existingRegularization) {
      // Mettre à jour la régularisation existante
      const updateData = {
        total_provisions: totalProvisionsCollected || 0,
        total_quote_part: recoverableCharges || 0,
        balance: tenantBalance || 0,
        calculation_method: calculationMethod,
        notes: calculationNotes,
        status: 'draft',
        updated_at: new Date().toISOString()
      }

      const { data: updatedRegularization, error: updateError } = await supabaseAdmin
        .from('charge_regularizations_v2')
        .update(updateData)
        .eq('id', existingRegularization.id)
        .select()
        .single()

      if (updateError) {
        console.error("Erreur mise à jour régularisation:", updateError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
      }

      regularization = updatedRegularization
      
      // Supprimer les anciennes dépenses et recréer
      if (chargeBreakdown && chargeBreakdown.length > 0) {
        // Supprimer les anciennes dépenses
        const { error: deleteError } = await supabaseAdmin
          .from('charge_expenses')
          .delete()
          .eq('regularization_id', regularization.id)
        
        if (deleteError) {
          console.error("Erreur suppression anciennes dépenses:", deleteError)
        }
        
        // Créer les nouvelles dépenses
        const expensesData = chargeBreakdown.map((charge: any) => ({
          regularization_id: regularization.id,
          category: charge.category,
          amount: charge.realAmount || 0,
          is_recoverable: charge.isRecoverable !== undefined ? charge.isRecoverable : true,
          notes: charge.notes || ''
        }))

        const { error: expensesError } = await supabaseAdmin
          .from('charge_expenses')
          .insert(expensesData)

        if (expensesError) {
          console.error("Erreur insertion nouvelles dépenses:", expensesError)
        }
      }
    } else {
      // Créer une nouvelle régularisation
      const insertData = {
        lease_id: leaseId,
        year: regularizationYear,
        days_occupied: 0, // Sera calculé côté frontend
        total_provisions: totalProvisionsCollected || 0,
        total_quote_part: recoverableCharges || 0,
        balance: tenantBalance || 0,
        calculation_method: calculationMethod,
        notes: calculationNotes,
        status: 'draft',
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      const { data: newRegularization, error: insertError } = await supabaseAdmin
        .from('charge_regularizations_v2')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error("Erreur création régularisation:", insertError)
        return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
      }

      regularization = newRegularization

      // Créer les dépenses
      if (chargeBreakdown && chargeBreakdown.length > 0) {
        const expensesData = chargeBreakdown.map((charge: any) => ({
          regularization_id: regularization.id,
          category: charge.category,
          amount: charge.realAmount || 0,
          is_recoverable: charge.isRecoverable !== undefined ? charge.isRecoverable : true,
          notes: charge.notes || ''
        }))

        const { error: expensesError } = await supabaseAdmin
          .from('charge_expenses')
          .insert(expensesData)

        if (expensesError) {
          console.error("Erreur création dépenses:", expensesError)
        }
      }
    }

    return NextResponse.json({ success: true, regularization })
  } catch (error) {
    console.error("Erreur API création régularisation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
