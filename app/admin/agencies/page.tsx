"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Users, Settings } from "lucide-react"
import { agencyApi } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

interface Agency {
  id: string
  name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  created_at: string
  updated_at: string
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#0066FF",
    secondary_color: "#FF6B00",
    accent_color: "#00C48C",
  })

  useEffect(() => {
    loadAgencies()
  }, [])

  const loadAgencies = async () => {
    try {
      setLoading(true)
      console.log("🔄 Chargement des agences...")
      const response = await agencyApi.getAll()
      console.log("✅ Agences chargées:", response)
      setAgencies(response.agencies || [])
    } catch (error) {
      console.error("❌ Erreur chargement agences:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les agences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setCreating(true)
      console.log("🏢 Création agence:", formData)
      const response = await agencyApi.create(formData)
      console.log("✅ Agence créée:", response)

      toast({
        title: "Succès",
        description: "Agence créée avec succès",
      })

      setIsDialogOpen(false)
      setFormData({
        name: "",
        logo_url: "",
        primary_color: "#0066FF",
        secondary_color: "#FF6B00",
        accent_color: "#00C48C",
      })
      await loadAgencies()
    } catch (error) {
      console.error("❌ Erreur création agence:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Chargement des agences...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Agences</h1>
          <p className="text-gray-600">Gérez les agences immobilières de la plateforme</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Agence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle agence</DialogTitle>
              <DialogDescription>Ajoutez une nouvelle agence immobilière à la plateforme</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAgency} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de l'agence *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Immobilier Central"
                  required
                />
              </div>

              <div>
                <Label htmlFor="logo_url">URL du logo (optionnel)</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Couleur primaire</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary_color">Couleur secondaire</Label>
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="accent_color">Couleur d'accent</Label>
                  <Input
                    id="accent_color"
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Création..." : "Créer l'agence"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agencies.map((agency) => (
          <Card key={agency.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url || "/placeholder.svg"}
                      alt={agency.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: agency.primary_color }}
                    >
                      {agency.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{agency.name}</CardTitle>
                    <CardDescription>Créée le {new Date(agency.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Propriétés
                  </span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Utilisateurs
                  </span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex space-x-2 pt-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: agency.primary_color }}></div>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: agency.secondary_color }}></div>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: agency.accent_color }}></div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Gérer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agencies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune agence</h3>
          <p className="text-gray-500 mb-4">Commencez par créer votre première agence immobilière</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une agence
          </Button>
        </div>
      )}
    </div>
  )
}
