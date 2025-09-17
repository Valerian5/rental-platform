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
  value: string | string[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  className?: string
  showRadius?: boolean
  onRadiusChange?: (radius: number) => void
  radius?: number
  multiple?: boolean
}

export function CityAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Rechercher une ville...", 
  className,
  showRadius = false,
  onRadiusChange,
  radius = 10,
  multiple = false
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Gérer les valeurs multiples ou simples
  const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
  const displayValue = multiple ? currentValues.join(", ") : (Array.isArray(value) ? value[0] || "" : value)

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
      } else if (searchTerm.length === 0) {
        setCities([])
        setHasSearched(false)
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])
  
  // Ouvrir le popover quand on commence à taper
  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      setOpen(true)
    }
  }, [searchTerm])

  const handleSelect = (city: City) => {
    const cityValue = `${city.nom} (${city.codePostal})`
    
    if (multiple) {
      // Mode multiple : ajouter à la liste
      const newValues = [...currentValues, cityValue]
      onChange(newValues)
    } else {
      // Mode simple : remplacer
      onChange(cityValue)
    }
    
    setSearchTerm("")
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    
    // En mode simple, mettre à jour la valeur
    if (!multiple) {
      onChange(newValue)
    }
  }
  
  const removeCity = (cityToRemove: string) => {
    if (multiple) {
      const newValues = currentValues.filter(city => city !== cityToRemove)
      onChange(newValues)
    }
  }

  return (
    <div className="space-y-2">
      {/* Affichage des villes sélectionnées en mode multiple */}
      {multiple && currentValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentValues.map((city, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
            >
              <MapPin className="h-3 w-3" />
              <span>{city}</span>
              <button
                type="button"
                onClick={() => removeCity(city)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={multiple ? searchTerm : displayValue}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              placeholder={placeholder}
              className={cn("pl-8 cursor-pointer", className)}
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
                      <Check className={cn("h-4 w-4", currentValues.includes(`${city.nom} (${city.codePostal})`) ? "opacity-100" : "opacity-0")} />
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
