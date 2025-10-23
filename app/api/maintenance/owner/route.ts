import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("ownerId")
    const year = searchParams.get("year")

    if (!ownerId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID propriétaire requis" 
      }, { status: 400 })
    }

    // Récupérer les baux du propriétaire
    const { data: leases, error: leasesError } = await supabase
      .from("leases")
      .select(`
        id,
        property_id,
        property:properties!inner(
          id,
          title,
          address
        ),
        tenant:users!leases_tenant_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq("owner_id", ownerId)

    if (leasesError) {
      console.error("Erreur récupération baux:", leasesError)
      return NextResponse.json({ 
        success: false, 
        error: "Erreur lors de la récupération des baux" 
      }, { status: 500 })
    }

    if (!leases || leases.length === 0) {
      return NextResponse.json({ 
        success: true, 
        works: [] 
      })
    }

    // Récupérer les travaux de maintenance pour toutes les propriétés
    const propertyIds = leases.map(lease => lease.property_id)
    
    let query = supabase
      .from("maintenance_works")
      .select(`
        id,
        title,
        description,
        type,
        category,
        status,
        scheduled_date,
        completed_date,
        cost,
        provider_name,
        provider_contact,
        property_id
      `)
      .in("property_id", propertyIds)

    // Filtrer par année si spécifiée
    if (year) {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      query = query
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
    }

    const { data: works, error: worksError } = await query

    if (worksError) {
      console.error("Erreur récupération travaux:", worksError)
      return NextResponse.json({ 
        success: false, 
        error: "Erreur lors de la récupération des travaux" 
      }, { status: 500 })
    }

    // Enrichir les données avec les informations de propriété et locataire
    const enrichedWorks = works?.map(work => {
      const lease = leases.find(l => l.property_id === work.property_id)
      return {
        ...work,
        property: lease?.property,
        lease: {
          id: lease?.id,
          tenant: lease?.tenant
        }
      }
    }) || []

    return NextResponse.json({ 
      success: true, 
      works: enrichedWorks 
    })

  } catch (error) {
    console.error("Erreur API maintenance owner:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}
