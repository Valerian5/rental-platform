"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Clock, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface IRLData {
  quarter: string
  value: number
  year: number
  quarter_number: number
}

interface IRLSelectorProps {
  value: string
  onValueChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function IRLSelector({
  value,
  onValueChange,
  label = "Trimestre de référence IRL",
  placeholder = "Sélectionner un trimestre",
  disabled = false,
  className = ""
}: IRLSelectorProps) {
  const [irlOptions, setIrlOptions] = useState<Array<{value: string, label: string}>>([])
  const [isLoadingIRL, setIsLoadingIRL] = useState(false)

  // Fonction pour charger les données IRL depuis l'API
  const loadIRLOptions = async () => {
    try {
      setIsLoadingIRL(true)
      
      // Charger les données IRL pour les 2 dernières années
      const currentYear = new Date().getFullYear()
      const years = [currentYear - 1, currentYear]
      
      const allOptions: Array<{value: string, label: string}> = []
      
      for (const year of years) {
        const response = await fetch(`/api/revisions/irl?year=${year}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          result.data.forEach((irlData: IRLData) => {
            const quarterNumber = irlData.quarter_number
            const quarterLabel = quarterNumber === 1 ? '1er' : `${quarterNumber}e`
            const value = `${year}-T${quarterNumber}`
            const label = `${quarterLabel} trimestre ${year} - ${irlData.value}`
            
            allOptions.push({ value, label })
          })
        }
      }
      
      // Trier par année et trimestre (plus récent en premier)
      allOptions.sort((a, b) => {
        const [yearA, quarterA] = a.value.split('-T').map(Number)
        const [yearB, quarterB] = b.value.split('-T').map(Number)
        
        if (yearA !== yearB) return yearB - yearA
        return quarterB - quarterA
      })
      
      setIrlOptions(allOptions)
    } catch (error) {
      console.error("Erreur chargement IRL:", error)
      toast.error("Erreur lors du chargement des indices IRL")
      
      // Fallback vers des options statiques en cas d'erreur
      setIrlOptions([
        { value: "2024-T4", label: "4e trimestre 2024 - 144,2" },
        { value: "2024-T3", label: "3e trimestre 2024 - 143,6" },
        { value: "2024-T2", label: "2e trimestre 2024 - 143,0" },
        { value: "2024-T1", label: "1er trimestre 2024 - 142,4" },
      ])
    } finally {
      setIsLoadingIRL(false)
    }
  }

  // Charger les options IRL au montage du composant
  useEffect(() => {
    loadIRLOptions()
  }, [])

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="irl-selector">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadIRLOptions}
          disabled={isLoadingIRL || disabled}
          className="h-8 px-2"
        >
          {isLoadingIRL ? (
            <Clock className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </div>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isLoadingIRL || disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoadingIRL ? "Chargement des indices IRL..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {irlOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoadingIRL && (
        <p className="text-sm text-muted-foreground mt-1">
          Chargement des indices IRL depuis l'INSEE...
        </p>
      )}
      {!isLoadingIRL && irlOptions.length === 0 && (
        <p className="text-sm text-muted-foreground mt-1">
          Aucun indice IRL disponible. Cliquez sur le bouton de rafraîchissement.
        </p>
      )}
      {!isLoadingIRL && irlOptions.length > 0 && (
        <p className="text-sm text-muted-foreground mt-1">
          Données IRL mises à jour depuis l'INSEE
        </p>
      )}
    </div>
  )
}
