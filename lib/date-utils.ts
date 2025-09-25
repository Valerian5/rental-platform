/**
 * Utilitaires pour les calculs de dates et proratisation
 */

export interface DateRange {
  start: Date
  end: Date
}

export interface ProrataCalculation {
  totalDays: number
  occupationDays: number
  percentage: number
  months: number
  exactMonths: number
}

/**
 * Calcule le nombre de jours entre deux dates (incluses)
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // +1 pour inclure le jour de fin
}

/**
 * Calcule le nombre de jours dans une année (gère les années bissextiles)
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

/**
 * Vérifie si une année est bissextile
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

/**
 * Calcule la période d'occupation effective pour une année donnée
 */
export function calculateEffectiveOccupationPeriod(
  leaseStartDate: Date,
  leaseEndDate: Date | null,
  targetYear: number
): DateRange {
  const yearStart = new Date(targetYear, 0, 1) // 1er janvier
  const yearEnd = new Date(targetYear, 11, 31) // 31 décembre
  
  // Début effectif = max(leaseStart, yearStart)
  const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart
  
  // Fin effective = min(leaseEnd, yearEnd) ou yearEnd si pas de fin de bail
  const effectiveEnd = leaseEndDate && leaseEndDate < yearEnd ? leaseEndDate : yearEnd
  
  return {
    start: effectiveStart,
    end: effectiveEnd
  }
}

/**
 * Calcule la proratisation exacte basée sur les jours
 */
export function calculateExactProrata(
  leaseStartDate: Date,
  leaseEndDate: Date | null,
  targetYear: number
): ProrataCalculation {
  const occupationPeriod = calculateEffectiveOccupationPeriod(
    leaseStartDate,
    leaseEndDate,
    targetYear
  )
  
  const totalDaysInYear = getDaysInYear(targetYear)
  const occupationDays = calculateDaysBetween(occupationPeriod.start, occupationPeriod.end)
  const percentage = (occupationDays / totalDaysInYear) * 100
  
  // Calcul approximatif en mois pour l'affichage
  const months = Math.round((occupationDays / totalDaysInYear) * 12 * 100) / 100
  const exactMonths = occupationDays / (totalDaysInYear / 12)
  
  return {
    totalDays: totalDaysInYear,
    occupationDays,
    percentage,
    months,
    exactMonths
  }
}

/**
 * Calcule la quote-part proratisée d'un montant annuel
 */
export function calculateProratedAmount(
  annualAmount: number,
  prorata: ProrataCalculation
): number {
  return (annualAmount * prorata.occupationDays) / prorata.totalDays
}

/**
 * Formate une période pour l'affichage
 */
export function formatPeriod(period: DateRange): string {
  const startStr = period.start.toLocaleDateString('fr-FR')
  const endStr = period.end.toLocaleDateString('fr-FR')
  return `${startStr} → ${endStr}`
}

/**
 * Formate un calcul de prorata pour l'affichage
 */
export function formatProrata(prorata: ProrataCalculation): string {
  return `${prorata.occupationDays} jours (${prorata.percentage.toFixed(1)}% de l'année)`
}
