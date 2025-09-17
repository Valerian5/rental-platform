"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, MapPin, Loader2, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchFrenchCities, findCitiesInRadius, type FrenchCity } from "@/lib/french-cities"
import { Slider } from "@/components/ui/slider"

// Utiliser le type FrenchCity de la base de données
type City = FrenchCity

interface CityAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showRadius?: boolean
  onRadiusChange?: (radius: number) => void
  radius?: number
}

export function CityAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Rechercher une ville...", 
  className,
  showRadius = false,
  onRadiusChange,
  radius = 10
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fonction pour rechercher les villes
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setCities([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)
    
    try {
      // Utiliser la base de données locale des villes françaises
      const cityResults = searchFrenchCities(query, 20)
      setCities(cityResults)
    } catch (error) {
      console.error("Erreur recherche villes:", error)
      setCities([])
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour gérer le changement de rayon
  const handleRadiusChange = (newRadius: number[]) => {
    if (onRadiusChange) {
      onRadiusChange(newRadius[0])
    }
  }

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 2) {
        searchCities(searchTerm)
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSelect = (city: City) => {
    const cityValue = `${city.nom} (${city.codePostal})`
    setSearchTerm(cityValue)
    onChange(cityValue)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className={cn("pl-8", className)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher une ville..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Recherche en cours...</span>
                </div>
              ) : cities.length === 0 && hasSearched ? (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p>Aucune ville trouvée</p>
                    <p className="text-sm text-muted-foreground">Essayez avec d'autres termes</p>
                  </div>
                </CommandEmpty>
              ) : cities.length > 0 ? (
                <CommandGroup>
                  {cities.map((city) => (
                    <CommandItem
                      key={`${city.nom}-${city.codeCommune}-${city.codePostal}`}
                      value={`${city.nom} ${city.codePostal}`}
                      onSelect={() => handleSelect(city)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{city.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {city.codePostal} - {city.departement}
                          </div>
                        </div>
                      </div>
                      <Check className={cn("h-4 w-4", searchTerm === `${city.nom} (${city.codePostal})` ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p>Tapez au moins 2 caractères</p>
                    <p className="text-sm text-muted-foreground">pour rechercher une ville</p>
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {showRadius && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Rayon de recherche : {radius} km</span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={handleRadiusChange}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>100 km</span>
          </div>
        </div>
      )}
    </div>
  )
}
