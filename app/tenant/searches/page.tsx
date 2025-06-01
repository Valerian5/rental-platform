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
import { authService } from "@/lib/auth-service"
import type { SavedSearch } from "@/lib/saved-search-service"
import { toast } from "sonner"

export default function TenantSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          window.location.href = "/login"
          return
        }

        setCurrentUser(user)
        await loadSearches(user.id)
      } catch (error) {
        console.error("Erreur chargement données:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadSearches = async (userId: string) => {
    try {
      const response = await fetch(`/api/saved-searches?user_id=${userId}`)
      if (!response.ok) throw new Error("Erreur chargement recherches")

      const data = await response.json()
      setSearches(data.searches || [])
    } catch (error) {
      console.error("Erreur chargement recherches:", error)
      toast.error("Erreur lors du chargement des recherches")
    }
  }

  const handleCreateSearch = async () => {
    if (!newSearch.name || !newSearch.city || !currentUser) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          ...newSearch,
        }),
      })

      if (!response.ok) throw new Error("Erreur création recherche")

      const data = await response.json()
      setSearches((prev) => [data.search, ...prev])
      setShowCreateDialog(false)
      resetNewSearch()
      toast.success("Recherche sauvegardée avec succès")
    } catch (error) {
      console.error("Erreur création recherche:", error)
      toast.error("Erreur lors de la création de la recherche")
    }
  }

  const handleDeleteSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/saved-searches?search_id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erreur suppression recherche")

      setSearches((prev) => prev.filter((s) => s.id !== id))
      toast.success("Recherche supprimée")
    } catch (error) {
      console.error("Erreur suppression recherche:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const toggleNotifications = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/saved-searches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search_id: id,
          notifications_enabled: enabled,
        }),
      })

      if (!response.ok) throw new Error("Erreur mise à jour notifications")

      setSearches((prev) => prev.map((s) => (s.id === id ? { ...s, notifications_enabled: enabled } : s)))
      toast.success("Notifications mises à jour")
    } catch (error) {
      console.error("Erreur toggle notifications:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const runSearch = (search: SavedSearch) => {
    const params = new URLSearchParams()
    if (search.city) params.set("city", search.city)
    if (search.property_type) params.set("property_type", search.property_type)
    if (search.min_price) params.set("min_price", search.min_price.toString())
    if (search.max_price) params.set("max_price", search.max_price.toString())
    if (search.min_rooms) params.set("min_rooms", search.min_rooms.toString())
    if (search.min_surface) params.set("min_surface", search.min_surface.toString())
    if (search.max_surface) params.set("max_surface", search.max_surface.toString())
    if (search.furnished !== undefined) params.set("furnished", search.furnished.toString())

    window.open(`/tenant/search?${params.toString()}`, "_blank")
  }

  const resetNewSearch = () => {
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de vos recherches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
                      <SelectItem value="all">Tous types</SelectItem>
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
                      {search.new_matches && search.new_matches > 0 && (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          {search.new_matches} nouveau{search.new_matches > 1 ? "x" : ""}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Créée le {new Date(search.created_at).toLocaleDateString("fr-FR")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleNotifications(search.id, !search.notifications_enabled)}
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
                    <p className="font-medium">{search.city || "Toutes"}</p>
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
                      {search.min_price || 0} - {search.max_price || "∞"} €/mois
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surface</p>
                    <p className="font-medium">
                      {search.min_surface || 0} - {search.max_surface || "∞"} m²
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span>Pièces: {search.min_rooms || 1}+</span>
                  {search.furnished && <Badge variant="secondary">Meublé</Badge>}
                  <span className="text-muted-foreground">
                    {search.match_count || 0} bien{(search.match_count || 0) > 1 ? "s" : ""} trouvé
                    {(search.match_count || 0) > 1 ? "s" : ""}
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
                  {search.new_matches && search.new_matches > 0 && (
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
