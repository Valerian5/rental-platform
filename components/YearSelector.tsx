"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface YearSelectorProps {
  value: number
  onChange: (year: number) => void
  leaseStartDate: string
  leaseEndDate: string
}

export function YearSelector({ value, onChange, leaseStartDate, leaseEndDate }: YearSelectorProps) {
  // Générer les années disponibles basées sur la période du bail
  const getAvailableYears = () => {
    const startYear = new Date(leaseStartDate).getFullYear()
    const endYear = new Date(leaseEndDate).getFullYear()
    const currentYear = new Date().getFullYear()
    
    const years = []
    const minYear = Math.min(startYear, currentYear)
    const maxYear = Math.max(endYear, currentYear)
    
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year)
    }
    
    return years.sort((a, b) => b - a) // Plus récent en premier
  }

  const availableYears = getAvailableYears()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Année de régularisation :</span>
        </div>
        
        <Select value={value.toString()} onValueChange={(year) => onChange(parseInt(year))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="text-sm text-gray-500">
          {availableYears.length} année{availableYears.length > 1 ? 's' : ''} disponible{availableYears.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
