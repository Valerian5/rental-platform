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
      .from('charge_regularizations')
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
        charge_breakdown(*)
      `)
      .eq('created_by', user.id)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    const { data: regularizations, error } = await query.order('regularization_date', { ascending: false })

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

    const body = await request.json()
    const { 
      leaseId, 
      propertyId, 
      regularizationYear,
      regularizationDate,
      totalProvisionsCollected,
      provisionsPeriodStart,
      provisionsPeriodEnd,
      totalRealCharges,
      recoverableCharges,
      nonRecoverableCharges,
      tenantBalance,
      balanceType,
      calculationMethod,
      calculationNotes,
      chargeBreakdown
    } = body

    const supabaseAdmin = createServerClient()
    
    // Vérifier que l'utilisateur est propriétaire de la propriété
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('owner_id')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Vérifier si une régularisation existe déjà pour ce bail et cette année
    const { data: existingRegularization, error: checkError } = await supabaseAdmin
      .from('charge_regularizations')
      .select('id')
      .eq('lease_id', leaseId)
      .eq('year', regularizationYear)
      .single()

    let regularization

    if (existingRegularization) {
      // Mettre à jour la régularisation existante
      const updateData = {
        regularization_date: regularizationDate,
        total_provisions_collected: totalProvisionsCollected?.toString(),
        provisions_period_start: provisionsPeriodStart,
        provisions_period_end: provisionsPeriodEnd,
        total_real_charges: totalRealCharges?.toString(),
        recoverable_charges: recoverableCharges?.toString(),
        non_recoverable_charges: nonRecoverableCharges?.toString(),
        tenant_balance: tenantBalance?.toString(),
        balance_type: balanceType,
        calculation_method: calculationMethod,
        calculation_notes: calculationNotes,
        // Ajouter les colonnes obligatoires
        total_charges_paid: totalProvisionsCollected || 0,
        actual_charges: totalRealCharges || 0,
        difference: tenantBalance || 0,
        type: balanceType,
        status: 'calculated',
        // Ajouter updated_at manuellement pour éviter le trigger
        updated_at: new Date().toISOString()
      }

      const { data: updatedRegularization, error: updateError } = await supabaseAdmin
        .from('charge_regularizations')
        .update(updateData)
        .eq('id', existingRegularization.id)
        .select()
        .single()

      if (updateError) {
        console.error("Erreur mise à jour régularisation:", updateError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
      }

      regularization = updatedRegularization
    } else {
      // Créer une nouvelle régularisation
      const insertData = {
        lease_id: leaseId,
        property_id: propertyId,
        year: regularizationYear, // Utiliser la colonne 'year' (integer)
        regularization_year: regularizationYear.toString(), // Garder aussi en text
        regularization_date: regularizationDate,
        total_provisions_collected: totalProvisionsCollected?.toString(),
        provisions_period_start: provisionsPeriodStart,
        provisions_period_end: provisionsPeriodEnd,
        total_real_charges: totalRealCharges?.toString(),
        recoverable_charges: recoverableCharges?.toString(),
        non_recoverable_charges: nonRecoverableCharges?.toString(),
        tenant_balance: tenantBalance?.toString(),
        balance_type: balanceType,
        calculation_method: calculationMethod,
        calculation_notes: calculationNotes,
        created_by: user.id,
        // Ajouter les colonnes obligatoires
        total_charges_paid: totalProvisionsCollected || 0,
        actual_charges: totalRealCharges || 0,
        difference: tenantBalance || 0,
        type: balanceType,
        status: 'calculated',
        // Ajouter updated_at manuellement
        updated_at: new Date().toISOString()
      }

      const { data: newRegularization, error: insertError } = await supabaseAdmin
        .from('charge_regularizations')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error("Erreur création régularisation:", insertError)
        return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
      }

      regularization = newRegularization
    }

    // Créer le détail des charges
    if (chargeBreakdown && chargeBreakdown.length > 0) {
      const breakdownData = chargeBreakdown.map((charge: any) => ({
        regularization_id: regularization.id,
        charge_category: charge.charge_category,
        charge_name: charge.charge_name,
        provision_amount: charge.provision_amount || 0,
        real_amount: charge.real_amount,
        difference: charge.difference,
        is_recoverable: charge.is_recoverable,
        is_exceptional: charge.is_exceptional,
        supporting_documents: charge.supporting_documents || [],
        notes: charge.notes
      }))

      const { error: breakdownError } = await supabaseAdmin
        .from('charge_breakdown')
        .insert(breakdownData)

      if (breakdownError) {
        console.error("Erreur création détail charges:", breakdownError)
        // Ne pas faire échouer la création de la régularisation
      }
    }

    return NextResponse.json({ success: true, regularization })
  } catch (error) {
    console.error("Erreur API création régularisation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
