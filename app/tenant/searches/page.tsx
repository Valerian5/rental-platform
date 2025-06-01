"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Trash2, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

interface SavedSearch {
  id: string
  name: string
  city: string
  property_type: string
  min_price: number
  max_price: number
  min_rooms: number
  min_surface: number
  max_surface: number
  furnished?: boolean
  notifications_enabled: boolean
  match_count: number
  new_matches: number
  created_at: string
  last_checked: string
}

export default function TenantSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)
  const [loading, setLoading] = useState(true)

  // Données simulées réalistes
  useEffect(() => {
    // Simuler le chargement des recherches
    setTimeout(() => {
      setSearches([
        {
          id: "1",
          name: "Appartement Paris Centre",
          city: "Paris",
          property_type: "apartment",
          min_price: 800,
          max_price: 1500,
          min_rooms: 2,
          min_surface: 40,
          max_surface: 80,
          furnished: false,
          notifications_enabled: true,
          match_count: 12,
          new_matches: 3,
          created_at: "2024-01-15T10:00:00Z",
          last_checked: "2024-01-20T15:30:00Z",
        },
        {
          id: "2",
          name: "Studio meublé Quartier Latin",
          city: "Paris 5e",
          property_type: "studio",
          min_price: 600,
          max_price: 1000,
          min_rooms: 1,
          min_surface: 20,
          max_surface: 35,
          furnished: true,
          notifications_enabled: true,
          match_count: 8,
          new_matches: 1,
          created_at: "2024-01-10T14:20:00Z",
          last_checked: "2024-01-20T12:00:00Z",
        },
        {
          id: "3",
          name: "Maison banlieue proche RER",
          city: "Vincennes",
          property_type: "house",
          min_price: 1200,
          max_price: 2000,
          min_rooms: 3,
          min_surface: 60,
          max_surface: 120,
          notifications_enabled: false,
          match_count: 5,
          new_matches: 0,
          created_at: "2024-01-08T09:15:00Z",
          last_checked: "2024-01-18T10:45:00Z",
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const [newSearch, setNewSearch] = useState({
    name: "",
    city: "",
    property_type: "",
    min_price: 500,
    max_price: 2000,
    min_rooms: 1,
    min_surface: 20,
    max_surface: 100,
    furnished: false,
    notifications_enabled: true,
  })

  const handleCreateSearch = () => {
    if (!newSearch.name || !newSearch.city) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    const search: SavedSearch = {
      id: Date.now().toString(),
      ...newSearch,
      match_count: Math.floor(Math.random() * 20),
      new_matches: Math.floor(Math.random() * 5),
      created_at: new Date().toISOString(),
      last_checked: new Date().toISOString(),
    }

    setSearches((prev) => [search, ...prev])
    setShowCreateDialog(false)
    setNewSearch({
      name: "",
      city: "",
      property_type: "",
      min_price: 500,
      max_price: 2000,
      min_rooms: 1,
      min_surface: 20,
      max_surface: 100,
      furnished: false,
      notifications_enabled: true,
    })
    toast.success("Recherche sauvegardée avec succès")
  }

  const handleDeleteSearch = (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id))
    toast.success("Recherche supprimée")
  }

  const toggleNotifications = (id: string) => {
    setSearches((prev) =>
      prev.map((s) => (s.id === id ? { ...s, notifications_enabled: !s.notifications_enabled } : s)),
    )
    toast.success("Notifications mises à jour")
  }

  const runSearch = (search: SavedSearch) => {
    // Simuler une nouvelle recherche
    const params = new URLSearchParams({
      city: search.city,
      property_type: search.property_type,
      min_price: search.min_price.toString(),
      max_price: search.max_price.toString(),
      min_rooms: search.min_rooms.toString(),
      min_surface: search.min_surface.toString(),
      max_surface: search.max_surface.toString(),
      furnished: search.furnished?.toString() || "false",
    })

    window.open(`/tenant/search?${params.toString()}`, "_blank")
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos recherches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes recherches sauvegardées</h1>
          <p className="text-muted-foreground">
            Gérez vos alertes et trouvez rapidement les biens qui vous intéressent
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle recherche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle recherche</DialogTitle>
              <DialogDescription>Configurez vos critères pour recevoir des alertes automatiques</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la recherche *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Appartement Paris Centre"
                  value={newSearch.name}
                  onChange={(e) => setNewSearch({ ...newSearch, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    placeholder="Paris, Lyon..."
                    value={newSearch.city}
                    onChange={(e) => setNewSearch({ ...newSearch, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type de bien</Label>
                  <Select
                    value={newSearch.property_type}
                    onValueChange={(value) => setNewSearch({ ...newSearch, property_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous types</SelectItem>
                      <SelectItem value="apartment">Appartement</SelectItem>
                      <SelectItem value="house">Maison</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="loft">Loft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Budget (€/mois)</Label>
                <div className="px-2">
                  <Slider
                    value={[newSearch.min_price, newSearch.max_price]}
                    onValueChange={([min, max]) => setNewSearch({ ...newSearch, min_price: min, max_price: max })}
                    max={3000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{newSearch.min_price}€</span>
                    <span>{newSearch.max_price}€</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Surface (m²)</Label>
                <div className="px-2">
                  <Slider
                    value={[newSearch.min_surface, newSearch.max_surface]}
                    onValueChange={([min, max]) => setNewSearch({ ...newSearch, min_surface: min, max_surface: max })}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{newSearch.min_surface}m²</span>
                    <span>{newSearch.max_surface}m²</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pièces minimum</Label>
                  <Select
                    value={newSearch.min_rooms.toString()}
                    onValueChange={(value) => setNewSearch({ ...newSearch, min_rooms: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="1+" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={newSearch.furnished}
                    onCheckedChange={(checked) => setNewSearch({ ...newSearch, furnished: checked })}
                  />
                  <Label>Meublé uniquement</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newSearch.notifications_enabled}
                  onCheckedChange={(checked) => setNewSearch({ ...newSearch, notifications_enabled: checked })}
                />
                <Label>Recevoir des alertes pour cette recherche</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateSearch}>Créer la recherche</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {searches.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune recherche sauvegardée</h3>
          <p className="text-muted-foreground mb-4">
            Créez votre première recherche pour recevoir des alertes personnalisées
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une recherche
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {searches.map((search) => (
            <Card key={search.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {search.name}
                      {search.new_matches > 0 && (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          {search.new_matches} nouveau{search.new_matches > 1 ? "x" : ""}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Créée le {new Date(search.created_at).toLocaleDateString("fr-FR")} • Dernière vérification:{" "}
                      {new Date(search.last_checked).toLocaleDateString("fr-FR")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleNotifications(search.id)}
                      title={search.notifications_enabled ? "Désactiver les alertes" : "Activer les alertes"}
                    >
                      {search.notifications_enabled ? (
                        <Bell className="h-4 w-4 text-blue-600" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSearch(search.id)}
                      title="Supprimer cette recherche"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ville</p>
                    <p className="font-medium">{search.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">
                      {search.property_type === "apartment" && "Appartement"}
                      {search.property_type === "house" && "Maison"}
                      {search.property_type === "studio" && "Studio"}
                      {search.property_type === "loft" && "Loft"}
                      {!search.property_type && "Tous types"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">
                      {search.min_price} - {search.max_price} €/mois
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surface</p>
                    <p className="font-medium">
                      {search.min_surface} - {search.max_surface} m²
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span>Pièces: {search.min_rooms}+</span>
                  {search.furnished && <Badge variant="secondary">Meublé</Badge>}
                  <span className="text-muted-foreground">
                    {search.match_count} bien{search.match_count > 1 ? "s" : ""} trouvé
                    {search.match_count > 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  {search.notifications_enabled ? (
                    <span className="flex items-center text-green-600">
                      <Bell className="h-3 w-3 mr-1" />
                      Alertes activées
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500">
                      <BellOff className="h-3 w-3 mr-1" />
                      Alertes désactivées
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => runSearch(search)}>
                    Lancer la recherche
                  </Button>
                  {search.new_matches > 0 && (
                    <Button size="sm" onClick={() => runSearch(search)}>
                      Voir les nouveautés ({search.new_matches})
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
