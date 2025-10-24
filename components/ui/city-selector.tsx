"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface CitySelectorProps {
  value?: string
  onChange: (city: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
}

// Liste des principales villes françaises
const FRENCH_CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier",
  "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble",
  "Dijon", "Angers", "Nîmes", "Villeurbanne", "Saint-Denis", "Le Mans", "Aix-en-Provence",
  "Clermont-Ferrand", "Brest", "Tours", "Amiens", "Limoges", "Annecy", "Perpignan",
  "Boulogne-Billancourt", "Orléans", "Mulhouse", "Rouen", "Caen", "Nancy", "Saint-Denis",
  "Argenteuil", "Montreuil", "Roubaix", "Tourcoing", "Nanterre", "Avignon", "Créteil",
  "Dunkirk", "Poitiers", "Asnières-sur-Seine", "Versailles", "Courbevoie", "Vitry-sur-Seine",
  "Colombes", "Aulnay-sous-Bois", "La Rochelle", "Rueil-Malmaison", "Antibes", "Saint-Maur-des-Fossés",
  "Champigny-sur-Marne", "Aubervilliers", "Cannes", "Béziers", "Colmar", "Drancy", "Mérignac",
  "Saint-Nazaire", "Issy-les-Moulineaux", "Noisy-le-Grand", "Évry", "Cergy", "Pessac", "Vénissieux",
  "Clichy", "Troyes", "Antony", "Neuilly-sur-Seine", "Levallois-Perret", "Montauban", "Sarcelles",
  "Niort", "Le Tampon", "Villejuif", "Hyères", "Cholet", "Narbonne", "Meudon", "Saint-André",
  "Beauvais", "Maisons-Alfort", "Chelles", "Villepinte", "Épinay-sur-Seine", "Lorient", "Saint-Louis",
  "La Seyne-sur-Mer", "Charleville-Mézières", "Saint-Ouen", "Roanne", "Tarbes", "Montrouge",
  "Saint-Germain-en-Laye", "Agen", "Sète", "Corbeil-Essonnes", "Saint-Brieuc", "Bayonne",
  "Caluire-et-Cuire", "Bourges", "Colombes", "Massy", "Blois", "Martigues", "Châteauroux",
  "Châlons-en-Champagne", "Meaux", "Châtelet", "Alès", "Saint-Priest", "Saint-Laurent-du-Var",
  "Belfort", "Sartrouville", "Évreux", "Villeneuve-d'Ascq", "Échirolles", "Montbéliard",
  "Neuilly-sur-Marne", "Châtenay-Malabry", "Thionville", "Puteaux", "Sainte-Geneviève-des-Bois",
  "Saint-Chamond", "Haguenau", "Gennevilliers", "Laval", "Belfort", "Saint-Martin-d'Hères",
  "Épinal", "Vaulx-en-Velin", "Montluçon", "Cannes", "Belfort", "Saint-Benoît", "Saint-Joseph",
  "Saint-Pierre", "Saint-Paul", "Saint-Denis", "Saint-André", "Saint-Louis", "Saint-Benoît",
  "Saint-Joseph", "Saint-Pierre", "Saint-Paul", "Saint-Denis", "Saint-André", "Saint-Louis"
]

export function CitySelector({
  value = "",
  onChange,
  placeholder = "Sélectionner une ville...",
  label,
  required = false,
  className
}: CitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [filteredCities, setFilteredCities] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtrer les villes basé sur la recherche
  useEffect(() => {
    if (searchValue.length === 0) {
      setFilteredCities(FRENCH_CITIES.slice(0, 20)) // Afficher les 20 premières villes par défaut
    } else {
      const filtered = FRENCH_CITIES.filter(city =>
        city.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 20) // Limiter à 20 résultats
      setFilteredCities(filtered)
    }
  }, [searchValue])

  const handleSelect = (city: string) => {
    onChange(city)
    setOpen(false)
    setSearchValue("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    if (!open) {
      setOpen(true)
    }
  }

  const handleInputFocus = () => {
    setOpen(true)
    setSearchValue("")
  }

  const handleInputBlur = () => {
    // Délai pour permettre la sélection d'un élément
    setTimeout(() => {
      setOpen(false)
    }, 200)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="city-selector">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "truncate",
                !value && "text-muted-foreground"
              )}>
                {value || placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder="Rechercher une ville..."
              value={searchValue}
              onValueChange={setSearchValue}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <CommandList>
              <CommandEmpty>
                {searchValue ? "Aucune ville trouvée." : "Tapez pour rechercher..."}
              </CommandEmpty>
              <CommandGroup>
                {filteredCities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => handleSelect(city)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{city}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === city ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
