import { NextRequest, NextResponse } from "next/server"
import { supabase, createServerClient } from "@/lib/supabase"

// Interface pour les données IRL de l'INSEE
interface IRLData {
  quarter: string
  value: number
  year: number
  quarter_number: number
}

// Interface pour les données de la base de données
interface IRLIndex {
  id: string
  year: number
  quarter: number
  value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const quarter = searchParams.get('quarter')

    if (!year) {
      return NextResponse.json({
        success: false,
        error: "Le paramètre 'year' est requis"
      }, { status: 400 })
    }

    const yearNum = parseInt(year)
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json({
        success: false,
        error: "L'année doit être entre 2020 et 2030"
      }, { status: 400 })
    }

    const supabaseAdmin = createServerClient()
    
    // Récupérer les données depuis la base de données
    let query = supabaseAdmin
      .from('irl_indices')
      .select('*')
      .eq('year', yearNum)
      .eq('is_active', true)
      .order('quarter', { ascending: true })

    // Filtrer par trimestre si spécifié
    if (quarter) {
      const quarterNum = parseInt(quarter.replace('Q', ''))
      if (!isNaN(quarterNum) && quarterNum >= 1 && quarterNum <= 4) {
        query = query.eq('quarter', quarterNum)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("Erreur base de données IRL:", error)
      return NextResponse.json({
        success: false,
        error: "Erreur lors de la récupération des données IRL"
      }, { status: 500 })
    }

    // Convertir les données de la base vers le format attendu
    const irlData: IRLData[] = (data || []).map((item: IRLIndex) => ({
      quarter: `${item.year}-Q${item.quarter}`,
      value: item.value,
      year: item.year,
      quarter_number: item.quarter
    }))

    return NextResponse.json({
      success: true,
      data: irlData,
      source: 'database'
    })

  } catch (error) {
    console.error("Erreur API IRL:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur lors de la récupération des données IRL" 
    }, { status: 500 })
  }
}

// Fonction utilitaire pour calculer la révision de loyer
export function calculateRentRevision(
  oldRent: number,
  referenceIRL: number,
  newIRL: number
): {
  newRent: number
  increase: number
  percentage: number
} {
  if (referenceIRL <= 0 || newIRL <= 0) {
    throw new Error("Les indices IRL doivent être positifs")
  }

  const newRent = (oldRent * newIRL) / referenceIRL
  const increase = newRent - oldRent
  const percentage = (increase / oldRent) * 100

  return {
    newRent: Math.round(newRent * 100) / 100, // Arrondir à 2 décimales
    increase: Math.round(increase * 100) / 100,
    percentage: Math.round(percentage * 100) / 100
  }
}