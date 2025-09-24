import { NextRequest, NextResponse } from "next/server"

// Interface pour les données IRL de l'INSEE
interface IRLData {
  quarter: string
  value: number
  year: number
  quarter_number: number
}

// Cache pour éviter trop d'appels à l'API INSEE
const irlCache = new Map<string, IRLData[]>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 heures

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const quarter = searchParams.get('quarter')

    if (!year) {
      return NextResponse.json({ error: "Année requise" }, { status: 400 })
    }

    const cacheKey = `irl_${year}`
    
    // Vérifier le cache
    if (irlCache.has(cacheKey)) {
      const cachedData = irlCache.get(cacheKey)!
      const cacheTime = cachedData[0]?.cacheTime || 0
      
      if (Date.now() - cacheTime < CACHE_DURATION) {
        const filteredData = quarter 
          ? cachedData.filter(item => item.quarter === quarter)
          : cachedData
        
        return NextResponse.json({ 
          success: true, 
          data: filteredData,
          cached: true 
        })
      }
    }

    // Récupérer les données IRL depuis l'API INSEE
    const irlData = await fetchIRLFromINSEE(parseInt(year))
    
    if (!irlData || irlData.length === 0) {
      return NextResponse.json({ 
        error: "Aucune donnée IRL trouvée pour cette année" 
      }, { status: 404 })
    }

    // Mettre en cache
    irlCache.set(cacheKey, irlData)

    // Filtrer par trimestre si demandé
    const filteredData = quarter 
      ? irlData.filter(item => item.quarter === quarter)
      : irlData

    return NextResponse.json({ 
      success: true, 
      data: filteredData,
      cached: false 
    })
  } catch (error) {
    console.error("Erreur récupération IRL:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des données IRL" 
    }, { status: 500 })
  }
}

async function fetchIRLFromINSEE(year: number): Promise<IRLData[]> {
  try {
    // Simulation des données IRL (en production, utiliser l'API INSEE réelle)
    // L'API INSEE réelle nécessiterait une clé API et une authentification
    
    const mockIRLData: IRLData[] = [
      {
        quarter: `${year}-Q1`,
        value: 137.56,
        year: year,
        quarter_number: 1
      },
      {
        quarter: `${year}-Q2`,
        value: 138.12,
        year: year,
        quarter_number: 2
      },
      {
        quarter: `${year}-Q3`,
        value: 138.89,
        year: year,
        quarter_number: 3
      },
      {
        quarter: `${year}-Q4`,
        value: 139.45,
        year: year,
        quarter_number: 4
      }
    ]

    // Ajouter un timestamp de cache
    mockIRLData.forEach(item => {
      (item as any).cacheTime = Date.now()
    })

    return mockIRLData
  } catch (error) {
    console.error("Erreur fetch IRL INSEE:", error)
    throw error
  }
}

// Fonction utilitaire pour calculer la révision de loyer
export function calculateRentRevision(
  oldRent: number,
  referenceIRL: number,
  newIRL: number
): {
  newRent: number
  increaseAmount: number
  increasePercentage: number
} {
  const newRent = (oldRent * newIRL) / referenceIRL
  const increaseAmount = newRent - oldRent
  const increasePercentage = (increaseAmount / oldRent) * 100

  return {
    newRent: Math.round(newRent * 100) / 100, // Arrondir à 2 décimales
    increaseAmount: Math.round(increaseAmount * 100) / 100,
    increasePercentage: Math.round(increasePercentage * 100) / 100
  }
}

// Fonction pour vérifier la conformité légale
export function checkLegalCompliance(
  increasePercentage: number,
  isRentControlledZone: boolean = false
): {
  isCompliant: boolean
  maxAllowedIncrease: number
  warnings: string[]
} {
  const warnings: string[] = []
  let maxAllowedIncrease = 3.5 // Augmentation maximale par défaut

  // Zone tendue : augmentation limitée
  if (isRentControlledZone) {
    maxAllowedIncrease = 2.5
    warnings.push("Zone tendue : augmentation limitée à 2,5%")
  }

  // Vérifier si l'augmentation dépasse le plafond
  if (increasePercentage > maxAllowedIncrease) {
    warnings.push(`Augmentation de ${increasePercentage.toFixed(2)}% dépasse le plafond de ${maxAllowedIncrease}%`)
  }

  return {
    isCompliant: increasePercentage <= maxAllowedIncrease,
    maxAllowedIncrease,
    warnings
  }
}
