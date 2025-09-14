"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  Upload,
  FileText,
  Home,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Eye,
} from "lucide-react"
import { toast } from "sonner"

interface PropertyData {
  id: string
  rooms: number
  bedrooms: number
  surface: number
  address: string
  city: string
  postal_code: string
}

interface LeaseData {
  locataire_nom_prenom: string
  bailleur_nom_prenom: string
  adresse_logement: string
  date_prise_effet: string
}

interface EtatDesLieuxSectionProps {
  leaseId: string
  propertyId: string
  propertyData?: PropertyData
  leaseData: LeaseData
}

interface EtatDesLieuxDocument {
  id: string
  type: "entree" | "sortie"
  status: "draft" | "completed" | "signed"
  created_at: string
  updated_at: string
  file_url?: string
  digital_data?: any
}

interface RoomState {
  id: string
  name: string
  ceiling: "excellent" | "good" | "fair" | "poor"
  walls: "excellent" | "good" | "fair" | "poor"
  floor: "excellent" | "good" | "fair" | "poor"
  windows: "excellent" | "good" | "fair" | "poor"
  doors: "excellent" | "good" | "fair" | "poor"
  comments: string
  photos: string[]
}

const ROOM_TYPES = {
  1: ["Pièce principale"],
  2: ["Pièce principale", "Chambre"],
  3: ["Pièce principale", "Chambre 1", "Chambre 2"],
  4: ["Pièce principale", "Chambre 1", "Chambre 2", "Chambre 3"],
  5: ["Pièce principale", "Chambre 1", "Chambre 2", "Chambre 3", "Chambre 4"],
}

const COMMON_ROOMS = ["Cuisine", "Salle de bains", "WC", "Entrée", "Couloir", "Balcon", "Cave", "Parking"]

export function EtatDesLieuxSection({ leaseId, propertyId, propertyData, leaseData }: EtatDesLieuxSectionProps) {
  const [documents, setDocuments] = useState<EtatDesLieuxDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [digitalMode, setDigitalMode] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<EtatDesLieuxDocument | null>(null)
  const [rooms, setRooms] = useState<RoomState[]>([])
  const [generalInfo, setGeneralInfo] = useState({
    date: "",
    time: "",
    owner_present: false,
    tenant_present: false,
    keys_count: 0,
    meter_readings: {
      electricity: "",
      gas: "",
      water_cold: "",
      water_hot: "",
    },
    comments: "",
  })

  const roomCount = propertyData?.rooms || 1
  const availableRooms = ROOM_TYPES[roomCount as keyof typeof ROOM_TYPES] || ROOM_TYPES[1]

  useEffect(() => {
    loadDocuments()
  }, [leaseId])

  useEffect(() => {
    if (digitalMode && rooms.length === 0) {
      initializeRooms()
    }
  }, [digitalMode, roomCount])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Erreur chargement documents:", error)
      toast.error("Erreur lors du chargement des documents")
    } finally {
      setLoading(false)
    }
  }

  const initializeRooms = () => {
    const newRooms: RoomState[] = [
      ...availableRooms.map((name, index) => ({
        id: `room-${index}`,
        name,
        ceiling: "good" as const,
        walls: "good" as const,
        floor: "good" as const,
        windows: "good" as const,
        doors: "good" as const,
        comments: "",
        photos: [],
      })),
      ...COMMON_ROOMS.map((name, index) => ({
        id: `common-${index}`,
        name,
        ceiling: "good" as const,
        walls: "good" as const,
        floor: "good" as const,
        windows: "good" as const,
        doors: "good" as const,
        comments: "",
        photos: [],
      })),
    ]
    setRooms(newRooms)
  }

  const downloadTemplate = async (type: "entree" | "sortie") => {
    try {
      const response = await fetch(`/api/etat-des-lieux/template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          room_count: roomCount,
          property_data: propertyData,
          lease_data: leaseData,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `etat-des-lieux-${type}-${roomCount}pieces.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Modèle téléchargé avec succès")
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement du modèle")
    }
  }

  const uploadDocument = async (file: File, type: "entree" | "sortie") => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      toast.success("Document uploadé avec succès")
      await loadDocuments()
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setUploading(false)
    }
  }

  const saveDigitalState = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/digital`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general_info: generalInfo,
          rooms: rooms,
          property_data: propertyData,
          lease_data: leaseData,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde")
      }

      toast.success("État des lieux numérique sauvegardé")
      await loadDocuments()
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Terminé</Badge>
      case "signed":
        return <Badge className="bg-blue-600">Signé</Badge>
      default:
        return <Badge variant="outline">Brouillon</Badge>
    }
  }

  const getStateLabel = (state: string) => {
    switch (state) {
      case "excellent":
        return "Très bon état"
      case "good":
        return "Bon état"
      case "fair":
        return "État moyen"
      case "poor":
        return "Mauvais état"
      default:
        return state
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "fair":
        return "text-yellow-600"
      case "poor":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des états des lieux...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            État des lieux - {propertyData?.address || "Propriété"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="font-medium">Propriétaire</Label>
              <p className="text-gray-600">{leaseData.bailleur_nom_prenom}</p>
            </div>
            <div>
              <Label className="font-medium">Locataire</Label>
              <p className="text-gray-600">{leaseData.locataire_nom_prenom}</p>
            </div>
            <div>
              <Label className="font-medium">Nombre de pièces</Label>
              <p className="text-gray-600">{roomCount} pièce{roomCount > 1 ? "s" : ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="bg-white">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="digital">État numérique</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Actions principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Télécharger un modèle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Téléchargez un modèle PDF adapté à votre logement ({roomCount} pièce{roomCount > 1 ? "s" : ""})
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => downloadTemplate("entree")} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Entrée
                  </Button>
                  <Button onClick={() => downloadTemplate("sortie")} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Sortie
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uploader un document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Uploadez un état des lieux complété et signé
                </p>
                <div className="space-y-2">
                  <Label htmlFor="entree-upload">État des lieux d'entrée</Label>
                  <Input
                    id="entree-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadDocument(file, "entree")
                    }}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortie-upload">État des lieux de sortie</Label>
                  <Input
                    id="sortie-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadDocument(file, "sortie")
                    }}
                    disabled={uploading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents d'état des lieux</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun document d'état des lieux</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            État des lieux {doc.type === "entree" ? "d'entrée" : "de sortie"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        {doc.file_url && (
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="digital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                État des lieux numérique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={generalInfo.date}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Heure</Label>
                    <Input
                      id="time"
                      type="time"
                      value={generalInfo.time}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="keys">Nombre de clés</Label>
                    <Input
                      id="keys"
                      type="number"
                      value={generalInfo.keys_count}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, keys_count: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Relevés de compteurs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="electricity">Électricité</Label>
                      <Input
                        id="electricity"
                        value={generalInfo.meter_readings.electricity}
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meter_readings: { ...generalInfo.meter_readings, electricity: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="gas">Gaz</Label>
                      <Input
                        id="gas"
                        value={generalInfo.meter_readings.gas}
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meter_readings: { ...generalInfo.meter_readings, gas: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="water-cold">Eau froide</Label>
                      <Input
                        id="water-cold"
                        value={generalInfo.meter_readings.water_cold}
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meter_readings: { ...generalInfo.meter_readings, water_cold: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="water-hot">Eau chaude</Label>
                      <Input
                        id="water-hot"
                        value={generalInfo.meter_readings.water_hot}
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meter_readings: { ...generalInfo.meter_readings, water_hot: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pièces */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">État des pièces</h3>
                <div className="space-y-6">
                  {rooms.map((room) => (
                    <Card key={room.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{room.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Plafond</Label>
                            <Select
                              value={room.ceiling}
                              onValueChange={(value: any) =>
                                setRooms(rooms.map((r) => (r.id === room.id ? { ...r, ceiling: value } : r)))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent">Très bon état</SelectItem>
                                <SelectItem value="good">Bon état</SelectItem>
                                <SelectItem value="fair">État moyen</SelectItem>
                                <SelectItem value="poor">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Murs</Label>
                            <Select
                              value={room.walls}
                              onValueChange={(value: any) =>
                                setRooms(rooms.map((r) => (r.id === room.id ? { ...r, walls: value } : r)))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent">Très bon état</SelectItem>
                                <SelectItem value="good">Bon état</SelectItem>
                                <SelectItem value="fair">État moyen</SelectItem>
                                <SelectItem value="poor">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Sol</Label>
                            <Select
                              value={room.floor}
                              onValueChange={(value: any) =>
                                setRooms(rooms.map((r) => (r.id === room.id ? { ...r, floor: value } : r)))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent">Très bon état</SelectItem>
                                <SelectItem value="good">Bon état</SelectItem>
                                <SelectItem value="fair">État moyen</SelectItem>
                                <SelectItem value="poor">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fenêtres</Label>
                            <Select
                              value={room.windows}
                              onValueChange={(value: any) =>
                                setRooms(rooms.map((r) => (r.id === room.id ? { ...r, windows: value } : r)))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent">Très bon état</SelectItem>
                                <SelectItem value="good">Bon état</SelectItem>
                                <SelectItem value="fair">État moyen</SelectItem>
                                <SelectItem value="poor">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Commentaires</Label>
                          <Textarea
                            value={room.comments}
                            onChange={(e) =>
                              setRooms(rooms.map((r) => (r.id === room.id ? { ...r, comments: e.target.value } : r)))
                            }
                            placeholder="Observations particulières..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDigitalMode(false)}>
                  Annuler
                </Button>
                <Button onClick={saveDigitalState}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
