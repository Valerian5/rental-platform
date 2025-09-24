import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const year = searchParams.get('year')

    let query = supabase
      .from('lease_revisions')
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
        )
      `)
      .eq('created_by', user.id)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (year) {
      query = query.eq('revision_year', parseInt(year))
    }

    const { data: revisions, error } = await query.order('revision_date', { ascending: false })

    if (error) {
      console.error("Erreur récupération révisions:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    return NextResponse.json({ success: true, revisions })
  } catch (error) {
    console.error("Erreur API révisions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      leaseId, 
      propertyId, 
      revisionYear, 
      revisionDate,
      referenceIrlValue,
      newIrlValue,
      irlQuarter,
      oldRentAmount,
      newRentAmount,
      rentIncreaseAmount,
      rentIncreasePercentage,
      calculationMethod,
      legalComplianceChecked,
      complianceNotes
    } = body

    // Vérifier que l'utilisateur est propriétaire de la propriété
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { data: revision, error } = await supabase
      .from('lease_revisions')
      .insert({
        lease_id: leaseId,
        property_id: propertyId,
        revision_year: revisionYear,
        revision_date: revisionDate,
        reference_irl_value: referenceIrlValue,
        new_irl_value: newIrlValue,
        irl_quarter: irlQuarter,
        old_rent_amount: oldRentAmount,
        new_rent_amount: newRentAmount,
        rent_increase_amount: rentIncreaseAmount,
        rent_increase_percentage: rentIncreasePercentage,
        calculation_method: calculationMethod,
        legal_compliance_checked: legalComplianceChecked,
        compliance_notes: complianceNotes,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création révision:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    return NextResponse.json({ success: true, revision })
  } catch (error) {
    console.error("Erreur API création révision:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
