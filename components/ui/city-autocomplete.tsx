"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface City {
  nom: string
  codePostal: string
  codeCommune: string
  departement: string
  region: string
}

interface CityAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CityAutocomplete({ value, onChange, placeholder = "Rechercher une ville...", className }: CityAutocompleteProps) {
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
      // Utiliser l'API Geoapify pour les villes françaises
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
      if (apiKey && apiKey !== 'demo') {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:fr&limit=15&apiKey=${apiKey}`
        )
        
        if (response.ok) {
          const data = await response.json()
          const cityResults = data.features
            ?.map((feature: any) => ({
              nom: feature.properties.city || feature.properties.name,
              codePostal: feature.properties.postcode,
              codeCommune: feature.properties.citycode,
              departement: feature.properties.county,
              region: feature.properties.state
            }))
            .filter((city: City) => city.nom && city.codePostal)
            .slice(0, 15) || []

          setCities(cityResults)
          return
        }
      }
      
      // Fallback avec des villes françaises populaires
      const fallbackCities = getFallbackCities(query)
      setCities(fallbackCities)
    } catch (error) {
      console.error("Erreur recherche villes:", error)
      // Fallback avec des villes françaises populaires
      const fallbackCities = getFallbackCities(query)
      setCities(fallbackCities)
    } finally {
      setLoading(false)
    }
  }

  // Fallback avec des villes françaises populaires
  const getFallbackCities = (query: string): City[] => {
    const popularCities = [
      { nom: "Paris", codePostal: "75001-75020", codeCommune: "75056", departement: "Paris", region: "Île-de-France" },
      { nom: "Lyon", codePostal: "69001-69009", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes" },
      { nom: "Marseille", codePostal: "13001-13016", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      // Villes commençant par MAR
      { nom: "Marseille", codePostal: "13001-13016", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13001", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13002", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13003", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13004", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13005", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13006", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13007", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13008", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13009", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13010", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13011", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13012", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13013", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13014", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13015", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13016", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13017", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13018", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13019", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marseille", codePostal: "13020", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Marcq-en-Barœul", codePostal: "59700", codeCommune: "59378", departement: "Nord", region: "Hauts-de-France" },
      { nom: "Marignane", codePostal: "13700", codeCommune: "13054", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Martigues", codePostal: "13500", codeCommune: "13056", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Mantes-la-Jolie", codePostal: "78200", codeCommune: "78361", departement: "Yvelines", region: "Île-de-France" },
      { nom: "Marne-la-Vallée", codePostal: "77420", codeCommune: "77004", departement: "Seine-et-Marne", region: "Île-de-France" },
      { nom: "Marly-le-Roi", codePostal: "78160", codeCommune: "78372", departement: "Yvelines", region: "Île-de-France" },
      { nom: "Marcoussis", codePostal: "91460", codeCommune: "91360", departement: "Essonne", region: "Île-de-France" },
      { nom: "Marolles-en-Brie", codePostal: "77120", codeCommune: "77276", departement: "Seine-et-Marne", region: "Île-de-France" },
      { nom: "Massy", codePostal: "91300", codeCommune: "91377", departement: "Essonne", region: "Île-de-France" },
      { nom: "Toulouse", codePostal: "31000-31081", codeCommune: "31555", departement: "Haute-Garonne", region: "Occitanie" },
      { nom: "Nice", codePostal: "06000-06008", codeCommune: "06088", departement: "Alpes-Maritimes", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Nantes", codePostal: "44000-44020", codeCommune: "44109", departement: "Loire-Atlantique", region: "Pays de la Loire" },
      { nom: "Montpellier", codePostal: "34000-34090", codeCommune: "34172", departement: "Hérault", region: "Occitanie" },
      { nom: "Strasbourg", codePostal: "67000-67084", codeCommune: "67482", departement: "Bas-Rhin", region: "Grand Est" },
      { nom: "Bordeaux", codePostal: "33000-33081", codeCommune: "33063", departement: "Gironde", region: "Nouvelle-Aquitaine" },
      { nom: "Lille", codePostal: "59000-59060", codeCommune: "59350", departement: "Nord", region: "Hauts-de-France" },
      { nom: "Rennes", codePostal: "35000-35044", codeCommune: "35238", departement: "Ille-et-Vilaine", region: "Bretagne" },
      { nom: "Reims", codePostal: "51000-51100", codeCommune: "51454", departement: "Marne", region: "Grand Est" },
      { nom: "Le Havre", codePostal: "76600-76620", codeCommune: "76351", departement: "Seine-Maritime", region: "Normandie" },
      { nom: "Saint-Étienne", codePostal: "42000-42003", codeCommune: "42218", departement: "Loire", region: "Auvergne-Rhône-Alpes" },
      { nom: "Toulon", codePostal: "83000-83000", codeCommune: "83137", departement: "Var", region: "Provence-Alpes-Côte d'Azur" },
      { nom: "Grenoble", codePostal: "38000-38000", codeCommune: "38185", departement: "Isère", region: "Auvergne-Rhône-Alpes" },
      { nom: "Dijon", codePostal: "21000-21000", codeCommune: "21231", departement: "Côte-d'Or", region: "Bourgogne-Franche-Comté" },
      { nom: "Angers", codePostal: "49000-49000", codeCommune: "49007", departement: "Maine-et-Loire", region: "Pays de la Loire" },
      { nom: "Nîmes", codePostal: "30000-30000", codeCommune: "30189", departement: "Gard", region: "Occitanie" },
      { nom: "Villeurbanne", codePostal: "69100-69100", codeCommune: "69266", departement: "Rhône", region: "Auvergne-Rhône-Alpes" }
    ]

    return popularCities
      .filter(city => 
        city.nom.toLowerCase().startsWith(query.toLowerCase()) ||
        city.nom.toLowerCase().includes(query.toLowerCase()) ||
        city.codePostal.includes(query)
      )
      .slice(0, 15)
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
  )
}
