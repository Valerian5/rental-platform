export interface MonthInfo {
  month: number
  year: number
  label: string
  key: string
}

export function getRequiredMonths(documentType: "payslip" | "rent_receipt"): MonthInfo[] {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  const months: MonthInfo[] = []

  if (currentDay <= 10) {
    // Pas encore reçu le document du mois en cours
    for (let i = 1; i <= 3; i++) {
      const monthInfo = getMonthYear(currentMonth - i, currentYear)
      months.push(monthInfo)
    }
  } else {
    // A probablement reçu le document du mois en cours
    for (let i = 0; i < 3; i++) {
      const monthInfo = getMonthYear(currentMonth - i, currentYear)
      months.push(monthInfo)
    }
  }

  return months
}

function getMonthYear(month: number, year: number): MonthInfo {
  let adjustedMonth = month
  let adjustedYear = year

  // Gérer les mois négatifs (année précédente)
  while (adjustedMonth <= 0) {
    adjustedMonth += 12
    adjustedYear -= 1
  }

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]

  return {
    month: adjustedMonth,
    year: adjustedYear,
    label: `${monthNames[adjustedMonth - 1]} ${adjustedYear}`,
    key: `${adjustedYear}-${adjustedMonth.toString().padStart(2, "0")}`,
  }
}

export function getCurrentMonthInfo(): MonthInfo {
  const today = new Date()
  return getMonthYear(today.getMonth() + 1, today.getFullYear())
}

export function isDocumentAvailable(documentType: "payslip" | "rent_receipt", targetMonth: MonthInfo): boolean {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  // Si c'est un mois futur, pas disponible
  if (targetMonth.year > currentYear || (targetMonth.year === currentYear && targetMonth.month > currentMonth)) {
    return false
  }

  // Si c'est le mois en cours et qu'on est avant le 10, pas encore disponible
  if (targetMonth.year === currentYear && targetMonth.month === currentMonth && currentDay <= 10) {
    return false
  }

  return true
}
