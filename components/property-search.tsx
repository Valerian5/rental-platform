"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { SearchIcon, XIcon } from "lucide-react"

export function PropertySearch() {
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    propertyType: "",
    rentalType: "",
    minPrice: [0],
    maxPrice: [2000],
    minRooms: "",
    minBedrooms: "",
    minSurface: "",
    maxSurface: "",
    features: [] as string[],
  })

  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const propertyFeatures = [
    { id: "balcony", label: "Balcon" },
    { id: "parking", label: "Parking" },
    { id: "elevator", label: "Ascenseur" },
    { id: "furnished", label: "Meublé" },
    { id: "garden", label: "Jardin" },
    { id: "terrace", label: "Terrasse" },
    { id: "cellar", label: "Cave" },
    { id: "fireplace", label: "Cheminée" },
  ]

  const handleFilterChange = (key: string, value: any) => {
    setSearchFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleFeatureToggle = (featureId: string) => {
    setSearchFilters((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((f) => f !== featureId)
        : [...prev.features, featureId],
    }))
  }

  const handleSearch = () => {
    console.log("Search filters:", searchFilters)
    // Here you would typically trigger the search
  }

  const clearFilters = () => {
    setSearchFilters({
      location: "",
      propertyType: "",
      rentalType: "",
      minPrice: [0],
      maxPrice: [2000],
      minRooms: "",
      minBedrooms: "",
      minSurface: "",
      maxSurface: "",
      features: [],
    })
    setActiveFilters([])
  }

  const removeFilter = (filterKey: string) => {
    if (filterKey === "features") {
      setSearchFilters((prev) => ({ ...prev, features: [] }))
    } else {
      setSearchFilters((prev) => ({ ...prev, [filterKey]: "" }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Filtres actifs</Label>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Tout effacer
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                {filter}
                <XIcon className="h-3 w-3 cursor-pointer" onClick={() => removeFilter(filter)} />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Localisation</Label>
        <Input
          id="location"
          placeholder="Ville, quartier, code postal..."
          value={searchFilters.location}
          onChange={(e) => handleFilterChange("location", e.target.value)}
        />
      </div>

      {/* Property type */}
      <div className="space-y-2">
        <Label htmlFor="propertyType">Type de bien</Label>
        <Select value={searchFilters.propertyType} onValueChange={(value) => handleFilterChange("propertyType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apartment">Appartement</SelectItem>
            <SelectItem value="house">Maison</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="loft">Loft</SelectItem>
            <SelectItem value="duplex">Duplex</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rental type */}
      <div className="space-y-2">
        <Label htmlFor="rentalType">Type de location</Label>
        <Select value={searchFilters.rentalType} onValueChange={(value) => handleFilterChange("rentalType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empty">Vide</SelectItem>
            <SelectItem value="furnished">Meublé</SelectItem>
            <SelectItem value="student">Étudiant</SelectItem>
            <SelectItem value="colocation">Colocation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div className="space-y-4">
        <Label>Budget mensuel (€)</Label>
        <div className="px-2">
          <Slider
            value={[searchFilters.minPrice[0], searchFilters.maxPrice[0]]}
            onValueChange={(value) => {
              handleFilterChange("minPrice", [value[0]])
              handleFilterChange("maxPrice", [value[1]])
            }}
            max={3000}
            min={0}
            step={50}
            className="w-full"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{searchFilters.minPrice[0]}€</span>
          <span>{searchFilters.maxPrice[0]}€</span>
        </div>
      </div>

      {/* Rooms and surface */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minRooms">Pièces min.</Label>
          <Select value={searchFilters.minRooms} onValueChange={(value) => handleFilterChange("minRooms", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minBedrooms">Chambres min.</Label>
          <Select value={searchFilters.minBedrooms} onValueChange={(value) => handleFilterChange("minBedrooms", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minSurface">Surface min. (m²)</Label>
          <Input
            id="minSurface"
            type="number"
            placeholder="0"
            value={searchFilters.minSurface}
            onChange={(e) => handleFilterChange("minSurface", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxSurface">Surface max. (m²)</Label>
          <Input
            id="maxSurface"
            type="number"
            placeholder="∞"
            value={searchFilters.maxSurface}
            onChange={(e) => handleFilterChange("maxSurface", e.target.value)}
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <Label>Équipements</Label>
        <div className="grid grid-cols-1 gap-3">
          {propertyFeatures.map((feature) => (
            <div key={feature.id} className="flex items-center space-x-2">
              <Checkbox
                id={feature.id}
                checked={searchFilters.features.includes(feature.id)}
                onCheckedChange={() => handleFeatureToggle(feature.id)}
              />
              <Label htmlFor={feature.id} className="text-sm font-normal">
                {feature.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Search button */}
      <Button onClick={handleSearch} className="w-full">
        <SearchIcon className="h-4 w-4 mr-2" />
        Rechercher
      </Button>
    </div>
  )
}
