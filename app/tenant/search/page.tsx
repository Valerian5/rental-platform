"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Heart, SlidersHorizontal, Star, Filter, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"
import { rentalFileService } from "@/lib/rental-file-service"
import { applicationEnrichmentService } from "@/lib/application-enrichment-service"
import Link from "next/link"
import { toast } from "sonner"

interface Property {
  id: string
  title: string
  address: string
  city: string
  postal_code: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  property_type: string
  furnished: boolean
  available: boolean
  property_images: Array<{ id: string; url: string; is_primary: boolean }>
  // Nouvelles propriétés
  hide_address?: boolean
  has_parking?: boolean
  has_balcony?: boolean
  has_elevator?: boolean
  has_security?: boolean
  internet?: boolean
  pets_allowed?: boolean
  energy_class?: string
  ges_class?: string
  available_from?: string
  // Score de compatibilité
  compatibility_score?: number
  owner_preferences?: any
  owner_id?: string
}

interface SearchFilters {
  city: string
  property_type: string
  min_price: number
  max_price: number
  min_rooms: number
  min_bedrooms: number
  min_surface: number
  max_surface: number
  furnished?: boolean
  // Nouveaux filtres
  has_parking?: boolean
  has_balcony?: boolean
  has_elevator?: boolean
  has_security?: boolean
  internet?: boolean
  pets_allowed?: boolean
  energy_class?: string
  min_compatibility_score?: number
  available_from?: string
  // Filtres par équipements
  equipment?: string[]
}

export default function TenantSearchPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState<SearchFilters>({
    city: "",
    property_type: "all",
    min_price: 0,
    max_price: 3000,
    min_rooms: 1,
    min_bedrooms: 0,
    min_surface: 0,
    max_surface: 200,
    furnished: undefined,
    has_parking: undefined,
    has_balcony: undefined,
    has_elevator: undefined,
    has_security: undefined,
    internet: undefined,
    pets_allowed: undefined,
    energy_class: "all",
    min_compatibility_score: 0,
    available_from: "",
    equipment: []
  })
  
  const [searchRadius, setSearchRadius] = useState(10) // Rayon de recherche en km

  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"price" | "surface" | "compatibility" | "date">("date")

  useEffect(() => {
    searchProperties()
  }, [currentPage])

  useEffect(() => {
    loadUserFavorites()
  }, [])

  const searchProperties = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null && value !== "all") {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, item))
          } else {
            searchParams.append(key, value.toString())
          }
        }
      })

      searchParams.append("page", currentPage.toString())
      searchParams.append("limit", "12")
      searchParams.append("sort_by", sortBy)

      const response = await fetch(`/api/search?${searchParams}`)
      if (response.ok) {
        const data = await response.json()
        
        // Calculer le score de compatibilité pour chaque propriété
        const propertiesWithScore = await Promise.all(
          data.properties.map(async (property: Property) => ({
            ...property,
            compatibility_score: await calculateCompatibilityScore(property)
          }))
        )

        // Trier par score de compatibilité si demandé
        if (sortBy === "compatibility") {
          propertiesWithScore.sort((a: Property, b: Property) => (b.compatibility_score || 0) - (a.compatibility_score || 0))
        }

        setProperties(propertiesWithScore)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        
        // Mettre à jour les filtres actifs
        updateActiveFilters()
      }
    } catch (error) {
      console.error("Erreur recherche:", error)
      toast.error("Erreur lors de la recherche")
    } finally {
      setLoading(false)
    }
  }

  // Calculer le score de compatibilité avec le service avancé
  const calculateCompatibilityScore = async (property: Property): Promise<number> => {
    try {
      // Récupérer les préférences du propriétaire
      const ownerPreferences = await scoringPreferencesService.getOwnerPreferences(property.owner_id || "")
      
      if (ownerPreferences) {
        // Essayer de récupérer les données du locataire connecté
        let applicationData = {
          income: 0,
          contract_type: "cdi",
          spouse_income: 0,
          spouse_contract_type: "cdi",
          guarantor_income: 0,
          guarantor_contract_type: "cdi",
          has_guarantor: false,
          documents_complete: false,
          presentation_message: "",
          move_in_date: "",
          profession: "",
          company: ""
        }
        
        // Si un locataire est connecté, essayer de récupérer son dossier
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}")
          if (user && user.user_type === "tenant") {
            const rentalFile = await rentalFileService.getRentalFile(user.id)
            if (rentalFile) {
              // Créer une candidature fictive pour utiliser le même enrichissement que côté propriétaire
              const mockApplication = {
                id: "mock-" + Date.now(),
                property_id: property.id,
                tenant_id: user.id,
                message: rentalFile.presentation_message || "",
                income: 0, // Sera enrichi
                profession: "",
                company: "",
                contract_type: "",
                has_guarantor: false,
                guarantor_income: 0,
                documents_complete: false,
                move_in_date: rentalFile.desired_move_date || "",
                presentation: rentalFile.presentation_message || "",
              }
              
              // Enrichir la candidature avec les données du RentalFile (même logique que côté propriétaire)
              applicationData = await applicationEnrichmentService.enrichApplication(mockApplication, rentalFile)
            }
          }
        } catch (error) {
          console.warn("Impossible de récupérer le dossier du locataire:", error)
        }
        
        const result = await scoringPreferencesService.calculateScore(
          applicationData,
          property,
          property.owner_id || "",
          true
        )
        
        return Math.min(result.totalScore, 100) // S'assurer que le score ne dépasse pas 100%
      }
    } catch (error) {
      console.warn("Erreur calcul score avancé pour propriété:", property.id, error)
    }
    
    // Fallback vers le calcul basique
    let score = 0
    
    // Score de base pour la disponibilité
    if (property.available) score += 20
    
    // Score pour les équipements
    if (property.has_parking) score += 10
    if (property.has_balcony) score += 10
    if (property.has_elevator) score += 5
    if (property.has_security) score += 10
    if (property.internet) score += 5
    if (property.pets_allowed) score += 5
    
    // Score pour la classe énergétique
    if (property.energy_class) {
      const energyScore = {
        'A': 15, 'B': 12, 'C': 10, 'D': 8, 'E': 5, 'F': 2, 'G': 0
      }
      score += energyScore[property.energy_class as keyof typeof energyScore] || 0
    }
    
    // Score pour le type de bien (préférences générales)
    const typeScore = {
      'apartment': 15,
      'house': 12,
      'studio': 8,
      'loft': 10
    }
    score += typeScore[property.property_type as keyof typeof typeScore] || 5
    
    return Math.min(100, score)
  }

  // Mettre à jour les filtres actifs
  const updateActiveFilters = () => {
    const active: string[] = []
    
    if (filters.city) active.push(`Ville: ${filters.city}`)
    if (filters.property_type && filters.property_type !== "all") active.push(`Type: ${filters.property_type}`)
    if (filters.min_price > 0 || filters.max_price < 5000) active.push(`Prix: ${filters.min_price}€ - ${filters.max_price}€`)
    if (filters.min_surface > 0 || filters.max_surface < 300) active.push(`Surface: ${filters.min_surface}m² - ${filters.max_surface}m²`)
    if (filters.furnished) active.push("Meublé")
    if (filters.has_parking) active.push("Parking")
    if (filters.has_balcony) active.push("Balcon")
    if (filters.has_elevator) active.push("Ascenseur")
    if (filters.has_security) active.push("Sécurisé")
    if (filters.internet) active.push("Internet")
    if (filters.pets_allowed) active.push("Animaux acceptés")
    if (filters.energy_class && filters.energy_class !== "all") active.push(`Classe énergétique: ${filters.energy_class}`)
    if (filters.min_compatibility_score > 0) active.push(`Score min: ${filters.min_compatibility_score}%`)
    
    setActiveFilters(active)
  }

  const loadUserFavorites = async () => {
    try {
      // Récupérer l'utilisateur connecté depuis le localStorage ou context
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      const response = await fetch(`/api/favorites?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const favoriteIds = new Set(data.favorites.map((f: any) => f.property_id))
        setFavorites(favoriteIds)
      }
    } catch (error) {
      console.error("Erreur chargement favoris:", error)
    }
  }

  const toggleFavorite = async (propertyId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        toast.error("Vous devez être connecté pour ajouter des favoris")
        return
      }

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          property_id: propertyId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newFavorites = new Set(favorites)

        if (data.isFavorite) {
          newFavorites.add(propertyId)
          toast.success("Ajouté aux favoris")
        } else {
          newFavorites.delete(propertyId)
          toast.success("Retiré des favoris")
        }

        setFavorites(newFavorites)
      }
    } catch (error) {
      console.error("Erreur toggle favori:", error)
      toast.error("Erreur lors de la modification des favoris")
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    searchProperties()
  }

  const resetFilters = () => {
    setFilters({
      city: "",
      property_type: "all",
      min_price: 0,
      max_price: 3000,
      min_rooms: 1,
      min_bedrooms: 0,
      min_surface: 0,
      max_surface: 200,
      furnished: undefined,
      has_parking: undefined,
      has_balcony: undefined,
      has_elevator: undefined,
      has_security: undefined,
      internet: undefined,
      pets_allowed: undefined,
      energy_class: "all",
      min_compatibility_score: 0,
      available_from: "",
      equipment: []
    })
    setActiveFilters([])
  }

  const removeFilter = (filterToRemove: string) => {
    const filterKey = filterToRemove.split(':')[0].toLowerCase().replace(' ', '_')
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterKey === 'min_price' ? 0 : 
                   filterKey === 'max_price' ? 5000 :
                   filterKey === 'min_surface' ? 0 :
                   filterKey === 'max_surface' ? 300 :
                   filterKey === 'min_compatibility_score' ? 0 :
                   filterKey === 'equipment' ? [] :
                   filterKey === 'property_type' ? 'all' :
                   filterKey === 'energy_class' ? 'all' :
                   ""
    }))
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50"
    if (score >= 60) return "text-yellow-600 bg-yellow-50"
    if (score >= 40) return "text-orange-600 bg-orange-50"
    return "text-red-600 bg-red-50"
  }


  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rechercher un logement</h1>
          <p className="text-muted-foreground">{total > 0 ? `${total} bien(s) trouvé(s)` : "Aucun bien trouvé"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Plus récents</SelectItem>
              <SelectItem value="price">Prix croissant</SelectItem>
              <SelectItem value="surface">Surface décroissante</SelectItem>
              <SelectItem value="compatibility">Score de compatibilité</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres {activeFilters.length > 0 && `(${activeFilters.length})`}
          </Button>
        </div>
      </div>

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {filter}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter(filter)}
                />
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Tout effacer
            </Button>
          </div>
        </div>
      )}

      {/* Barre de recherche rapide */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <CityAutocomplete
                value={filters.city}
                onChange={(value) => setFilters((prev) => ({ ...prev, city: value }))}
                placeholder="Rechercher une ville..."
                showRadius={true}
                radius={searchRadius}
                onRadiusChange={setSearchRadius}
              />
            </div>
            <Select
              value={filters.property_type}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, property_type: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="apartment">Appartement</SelectItem>
                <SelectItem value="house">Maison</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
              {loading ? "Recherche..." : "Rechercher"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtres avancés */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres avancés
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Section Budget et Surface */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Budget et Surface</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base">Budget mensuel (€)</Label>
                    <div className="px-2">
                      <Slider
                        value={[filters.min_price, filters.max_price]}
                        onValueChange={([min, max]) =>
                          setFilters((prev) => ({ ...prev, min_price: min, max_price: max }))
                        }
                        max={5000}
                        step={50}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span className="font-medium">{filters.min_price}€</span>
                        <span className="font-medium">{filters.max_price}€</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">Surface (m²)</Label>
                    <div className="px-2">
                      <Slider
                        value={[filters.min_surface, filters.max_surface]}
                        onValueChange={([min, max]) =>
                          setFilters((prev) => ({ ...prev, min_surface: min, max_surface: max }))
                        }
                        max={300}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span className="font-medium">{filters.min_surface}m²</span>
                        <span className="font-medium">{filters.max_surface}m²</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section Caractéristiques */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Caractéristiques</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de pièces minimum</Label>
                    <Select
                      value={filters.min_rooms.toString()}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, min_rooms: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Chambres minimum</Label>
                    <Select
                      value={filters.min_bedrooms.toString()}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, min_bedrooms: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Peu importe</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Classe énergétique</Label>
                    <Select
                      value={filters.energy_class}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, energy_class: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section Équipements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Équipements et services</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="furnished"
                      checked={filters.furnished === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, furnished: checked ? true : undefined }))
                      }
                    />
                    <Label htmlFor="furnished" className="text-sm">Meublé</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="parking"
                      checked={filters.has_parking === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, has_parking: checked ? true : undefined }))
                      }
                    />
                    <Label htmlFor="parking" className="text-sm">Parking</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="balcony"
                      checked={filters.has_balcony === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, has_balcony: checked ? true : undefined }))
                      }
                    />
                    <Label htmlFor="balcony" className="text-sm">Balcon</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="elevator"
                      checked={filters.has_elevator === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, has_elevator: checked ? true : undefined }))
                      }
                    />
                    <Label htmlFor="elevator" className="text-sm">Ascenseur</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="security"
                      checked={filters.has_security === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, has_security: checked ? true : undefined }))
                      }
                    />
                    <Label htmlFor="security" className="text-sm">Sécurisé</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="internet"
                      checked={filters.internet === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, internet: checked ? true : undefined }))
                      }
                    />
                    <Label htmlFor="internet" className="text-sm">Internet</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pets"
                      checked={filters.pets_allowed === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, pets_allowed: checked ? true : undefined }))
                      }
                    />
                    <Label htmlFor="pets" className="text-sm">Animaux acceptés</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section Score de compatibilité */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Score de compatibilité</h3>
                <div className="space-y-3">
                  <Label className="text-base">Score minimum de compatibilité</Label>
                  <div className="px-2">
                    <Slider
                      value={[filters.min_compatibility_score]}
                      onValueChange={([value]) =>
                        setFilters((prev) => ({ ...prev, min_compatibility_score: value }))
                      }
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span className="font-medium">0%</span>
                      <span className="font-medium">{filters.min_compatibility_score}%</span>
                      <span className="font-medium">100%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Afficher uniquement les biens avec un score de compatibilité supérieur à {filters.min_compatibility_score}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSearch} disabled={loading} className="flex-1">
                  {loading ? "Recherche..." : "Appliquer les filtres"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const primaryImage =
                property.property_images?.find((img) => img.is_primary) || property.property_images?.[0]
              const isFavorite = favorites.has(property.id)

              return (
                <Card key={property.id} className="overflow-hidden group">
                  <div className="relative aspect-video overflow-hidden">
                    <Link href={`/properties/${property.id}`}>
                      <img
                        src={primaryImage?.url || "/placeholder.svg?height=200&width=300"}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-2 right-2 h-8 w-8 rounded-full ${
                        isFavorite
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-white/80 text-gray-600 hover:bg-white"
                      }`}
                      onClick={() => toggleFavorite(property.id)}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    </Button>
                    <Badge className="absolute bottom-2 left-2">
                      {property.property_type === "apartment" && "Appartement"}
                      {property.property_type === "house" && "Maison"}
                      {property.property_type === "studio" && "Studio"}
                      {property.property_type === "loft" && "Loft"}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/properties/${property.id}`}>
                          <CardTitle className="text-lg hover:text-blue-600 transition-colors line-clamp-2">
                            {property.title}
                          </CardTitle>
                        </Link>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {property.hide_address ? (
                            <span className="italic">Adresse masquée, {property.city}</span>
                          ) : (
                            <span>{property.address}, {property.city}</span>
                          )}
                        </div>
                      </div>
                      {property.compatibility_score !== undefined && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(property.compatibility_score)}`}>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {property.compatibility_score}%
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Pièces</p>
                        <p className="font-medium">{property.rooms}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Chambres</p>
                        <p className="font-medium">{property.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Surface</p>
                        <p className="font-medium">{property.surface} m²</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {property.furnished && (
                        <Badge variant="secondary" className="text-xs">
                          Meublé
                        </Badge>
                      )}
                      {property.has_parking && (
                        <Badge variant="outline" className="text-xs">
                          Parking
                        </Badge>
                      )}
                      {property.has_balcony && (
                        <Badge variant="outline" className="text-xs">
                          Balcon
                        </Badge>
                      )}
                      {property.has_elevator && (
                        <Badge variant="outline" className="text-xs">
                          Ascenseur
                        </Badge>
                      )}
                      {property.internet && (
                        <Badge variant="outline" className="text-xs">
                          Internet
                        </Badge>
                      )}
                      {property.pets_allowed && (
                        <Badge variant="outline" className="text-xs">
                          Animaux
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{property.price} €/mois</p>
                    </div>
                    <Button asChild>
                      <Link href={`/properties/${property.id}`}>Voir détails</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  &lt;
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  &gt;
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {properties.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun bien trouvé</h3>
          <p className="text-muted-foreground mb-4">
            Essayez de modifier vos critères de recherche pour voir plus de résultats.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  )
}
