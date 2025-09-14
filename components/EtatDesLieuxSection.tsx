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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  type: "main" | "water" | "annex"
  elements: {
    sols: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    murs: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    plafonds: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    portes: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    fenetres: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    volets: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    plinthes: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    radiateurs: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    interrupteurs: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    prises: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
    eclairages: { state: "absent" | "M" | "P" | "B" | "TB"; comment: string }
  }
  comment: string
  photos: string[]
}

const ROOM_CATEGORIES = {
  main: [
    { value: "sejour", label: "Séjour / Salle à manger" },
    { value: "chambre", label: "Chambre" },
    { value: "salon", label: "Salon" },
    { value: "salle_manger", label: "Salle à manger" },
  ],
  water: [
    { value: "cuisine", label: "Cuisine" },
    { value: "salle_bain", label: "Salle de bain" },
    { value: "salle_eau", label: "Salle d'eau" },
    { value: "toilette", label: "Toilette" },
  ],
  annex: [
    { value: "bureau", label: "Bureau" },
    { value: "buanderie", label: "Buanderie" },
    { value: "dressing", label: "Dressing" },
    { value: "garage", label: "Garage" },
    { value: "autre", label: "Autre" },
  ],
}

const ELEMENT_LABELS = {
  sols: "Sols",
  murs: "Murs",
  plafonds: "Plafonds",
  portes: "Portes",
  fenetres: "Fenêtres",
  volets: "Volets",
  plinthes: "Plinthes",
  radiateurs: "Radiateurs",
  interrupteurs: "Interrupteurs",
  prises: "Prises électriques",
  eclairages: "Éclairages",
}

export function EtatDesLieuxSection({ leaseId, propertyId, propertyData, leaseData }: EtatDesLieuxSectionProps) {
  const [documents, setDocuments] = useState<EtatDesLieuxDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [digitalMode, setDigitalMode] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<EtatDesLieuxDocument | null>(null)
  const [rooms, setRooms] = useState<RoomState[]>([])
  const [generalInfo, setGeneralInfo] = useState({
    type: "entree" as "entree" | "sortie",
    date: "",
    address: "",
    owner: {
      first_name: "",
      last_name: "",
      email: "",
      is_mandataire: false,
      mandataire_address: "",
    },
    tenant: {
      first_name: "",
      last_name: "",
      email: "",
    },
    heating: {
      type: "individuel" as "individuel" | "collectif" | "pas_de_chauffage",
      fuel_type: "electrique" as "electrique" | "gaz" | "fioul" | "autre",
      other_type: "",
    },
    hot_water: {
      type: "individuelle" as "individuelle" | "collective",
      fuel_type: "electrique" as "electrique" | "gaz" | "fioul" | "autre",
      other_type: "",
    },
    meters: {
      electricity: {
        number: "",
        full_hour: "",
        off_peak: "",
      },
      gas: {
        number: "",
        reading: "",
      },
      water: {
        number: "",
        reading: "",
      },
    },
    keys: {
      entrance: 0,
      building: 0,
      parking: 0,
      mailbox: 0,
      cellar: 0,
      other: 0,
      other_type: "",
    },
    photos: [] as string[],
    annexes: [] as string[],
    general_comment: "",
  })

  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false)
  const [newRoom, setNewRoom] = useState({
    category: "main" as "main" | "water" | "annex",
    type: "",
    name: "",
  })
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)

  useEffect(() => {
    loadDocuments()
  }, [leaseId])

  useEffect(() => {
    if (digitalMode && rooms.length === 0) {
      initializeRooms()
    }
  }, [digitalMode])

  useEffect(() => {
    // Pré-remplir les informations générales avec les données du bail
    if (leaseData) {
      setGeneralInfo(prev => ({
        ...prev,
        address: leaseData.adresse_logement,
        owner: {
          ...prev.owner,
          first_name: leaseData.bailleur_nom_prenom.split(' ')[0] || '',
          last_name: leaseData.bailleur_nom_prenom.split(' ').slice(1).join(' ') || '',
        },
        tenant: {
          ...prev.tenant,
          first_name: leaseData.locataire_nom_prenom.split(' ')[0] || '',
          last_name: leaseData.locataire_nom_prenom.split(' ').slice(1).join(' ') || '',
        },
      }))
    }
  }, [leaseData])

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
    // Initialiser avec des pièces par défaut
    const defaultRooms: RoomState[] = [
      {
        id: "sejour",
        name: "Séjour",
        type: "main",
        elements: {
          sols: { state: "B", comment: "" },
          murs: { state: "B", comment: "" },
          plafonds: { state: "B", comment: "" },
          portes: { state: "B", comment: "" },
          fenetres: { state: "B", comment: "" },
          volets: { state: "absent", comment: "" },
          plinthes: { state: "B", comment: "" },
          radiateurs: { state: "B", comment: "" },
          interrupteurs: { state: "B", comment: "" },
          prises: { state: "B", comment: "" },
          eclairages: { state: "B", comment: "" },
        },
        comment: "",
        photos: [],
      },
      {
        id: "cuisine",
        name: "Cuisine",
        type: "water",
        elements: {
          sols: { state: "B", comment: "" },
          murs: { state: "B", comment: "" },
          plafonds: { state: "B", comment: "" },
          portes: { state: "B", comment: "" },
          fenetres: { state: "B", comment: "" },
          volets: { state: "absent", comment: "" },
          plinthes: { state: "B", comment: "" },
          radiateurs: { state: "B", comment: "" },
          interrupteurs: { state: "B", comment: "" },
          prises: { state: "B", comment: "" },
          eclairages: { state: "B", comment: "" },
        },
        comment: "",
        photos: [],
      },
      {
        id: "salle_bain",
        name: "Salle de bain",
        type: "water",
        elements: {
          sols: { state: "B", comment: "" },
          murs: { state: "B", comment: "" },
          plafonds: { state: "B", comment: "" },
          portes: { state: "B", comment: "" },
          fenetres: { state: "B", comment: "" },
          volets: { state: "absent", comment: "" },
          plinthes: { state: "B", comment: "" },
          radiateurs: { state: "B", comment: "" },
          interrupteurs: { state: "B", comment: "" },
          prises: { state: "B", comment: "" },
          eclairages: { state: "B", comment: "" },
        },
        comment: "",
        photos: [],
      },
    ]
    setRooms(defaultRooms)
  }

  const addRoom = () => {
    if (!newRoom.type || !newRoom.name) return

    const roomType = ROOM_CATEGORIES[newRoom.category].find(r => r.value === newRoom.type)
    const newRoomState: RoomState = {
      id: `${newRoom.type}-${Date.now()}`,
      name: newRoom.name,
      type: newRoom.category,
      elements: {
        sols: { state: "B", comment: "" },
        murs: { state: "B", comment: "" },
        plafonds: { state: "B", comment: "" },
        portes: { state: "B", comment: "" },
        fenetres: { state: "B", comment: "" },
        volets: { state: "absent", comment: "" },
        plinthes: { state: "B", comment: "" },
        radiateurs: { state: "B", comment: "" },
        interrupteurs: { state: "B", comment: "" },
        prises: { state: "B", comment: "" },
        eclairages: { state: "B", comment: "" },
      },
      comment: "",
      photos: [],
    }

    setRooms([...rooms, newRoomState])
    setNewRoom({ category: "main", type: "", name: "" })
    setShowAddRoomDialog(false)
  }

  const removeRoom = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId))
    if (currentRoomIndex >= rooms.length - 1) {
      setCurrentRoomIndex(Math.max(0, rooms.length - 2))
    }
  }

  const updateRoomElement = (roomId: string, element: string, state: string, comment: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? {
            ...room,
            elements: {
              ...room.elements,
              [element]: { state: state as any, comment }
            }
          }
        : room
    ))
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section Pièces */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Pièces du logement
                    </CardTitle>
                    <Button onClick={() => setShowAddRoomDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une pièce
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucune pièce configurée</p>
                      <p className="text-sm text-gray-500">Ajoutez des pièces pour commencer l'état des lieux</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Navigation par pièces */}
                      <div className="flex flex-wrap gap-2">
                        {rooms.map((room, index) => (
                          <Button
                            key={room.id}
                            variant={currentRoomIndex === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentRoomIndex(index)}
                          >
                            {room.name}
                          </Button>
                        ))}
                      </div>

                      {/* Contenu de la pièce sélectionnée */}
                      {rooms[currentRoomIndex] && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">{rooms[currentRoomIndex].name}</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeRoom(rooms[currentRoomIndex].id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Éléments de la pièce */}
                          <div className="space-y-4">
                            {Object.entries(ELEMENT_LABELS).map(([key, label]) => (
                              <div key={key} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="font-medium">{label}</Label>
                                  <Select
                                    value={rooms[currentRoomIndex].elements[key as keyof typeof rooms[0].elements].state}
                                    onValueChange={(value) => updateRoomElement(rooms[currentRoomIndex].id, key, value, rooms[currentRoomIndex].elements[key as keyof typeof rooms[0].elements].comment)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="absent">Absent</SelectItem>
                                      <SelectItem value="M">M</SelectItem>
                                      <SelectItem value="P">P</SelectItem>
                                      <SelectItem value="B">B</SelectItem>
                                      <SelectItem value="TB">TB</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Textarea
                                  placeholder="Commentaire sur cet élément..."
                                  value={rooms[currentRoomIndex].elements[key as keyof typeof rooms[0].elements].comment}
                                  onChange={(e) => updateRoomElement(rooms[currentRoomIndex].id, key, rooms[currentRoomIndex].elements[key as keyof typeof rooms[0].elements].state, e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Commentaire sur la pièce */}
                          <div>
                            <Label>Commentaire sur cette pièce</Label>
                            <Textarea
                              placeholder="Ajoutez des précisions sur un élément ou une description d'un élément non listé..."
                              value={rooms[currentRoomIndex].comment}
                              onChange={(e) => setRooms(rooms.map((r, i) => i === currentRoomIndex ? { ...r, comment: e.target.value } : r))}
                            />
                          </div>

                          {/* Photos de la pièce */}
                          <div>
                            <Label>Photos de la pièce</Label>
                            <p className="text-sm text-gray-500 mb-2">Photos justificatives ({rooms[currentRoomIndex].photos.length}/5)</p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">Cliquez pour ajouter des photos</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section Informations */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type d'état des lieux</Label>
                      <Select
                        value={generalInfo.type}
                        onValueChange={(value: "entree" | "sortie") => setGeneralInfo({ ...generalInfo, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entree">Entrée</SelectItem>
                          <SelectItem value="sortie">Sortie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date d'entrée</Label>
                      <Input
                        type="date"
                        value={generalInfo.date}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Adresse du logement</Label>
                    <Input
                      value={generalInfo.address}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Propriétaire</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Prénom"
                            value={generalInfo.owner.first_name}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, owner: { ...generalInfo.owner, first_name: e.target.value } })}
                          />
                          <Input
                            placeholder="Nom"
                            value={generalInfo.owner.last_name}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, owner: { ...generalInfo.owner, last_name: e.target.value } })}
                          />
                        </div>
                        <Input
                          placeholder="Email"
                          type="email"
                          value={generalInfo.owner.email}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, owner: { ...generalInfo.owner, email: e.target.value } })}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="mandataire"
                            checked={generalInfo.owner.is_mandataire}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, owner: { ...generalInfo.owner, is_mandataire: e.target.checked } })}
                          />
                          <Label htmlFor="mandataire">Propriétaire représenté par un mandataire</Label>
                        </div>
                        {generalInfo.owner.is_mandataire && (
                          <Input
                            placeholder="Adresse du mandataire"
                            value={generalInfo.owner.mandataire_address}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, owner: { ...generalInfo.owner, mandataire_address: e.target.value } })}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Locataire</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Prénom"
                            value={generalInfo.tenant.first_name}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, tenant: { ...generalInfo.tenant, first_name: e.target.value } })}
                          />
                          <Input
                            placeholder="Nom"
                            value={generalInfo.tenant.last_name}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, tenant: { ...generalInfo.tenant, last_name: e.target.value } })}
                          />
                        </div>
                        <Input
                          placeholder="Email"
                          type="email"
                          value={generalInfo.tenant.email}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, tenant: { ...generalInfo.tenant, email: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section Autres */}
              <Card>
                <CardHeader>
                  <CardTitle>Autres informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Chauffage */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Chauffage</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Type de chauffage</Label>
                        <Select
                          value={generalInfo.heating.type}
                          onValueChange={(value: "individuel" | "collectif" | "pas_de_chauffage") => setGeneralInfo({ ...generalInfo, heating: { ...generalInfo.heating, type: value } })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individuel">Individuel</SelectItem>
                            <SelectItem value="collectif">Collectif</SelectItem>
                            <SelectItem value="pas_de_chauffage">Pas de chauffage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {generalInfo.heating.type === "individuel" && (
                        <div>
                          <Label>Type de combustible</Label>
                          <Select
                            value={generalInfo.heating.fuel_type}
                            onValueChange={(value: "electrique" | "gaz" | "fioul" | "autre") => setGeneralInfo({ ...generalInfo, heating: { ...generalInfo.heating, fuel_type: value } })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electrique">Électrique</SelectItem>
                              <SelectItem value="gaz">Gaz</SelectItem>
                              <SelectItem value="fioul">Fioul</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    {generalInfo.heating.fuel_type === "autre" && (
                      <Input
                        placeholder="Précisez le type"
                        value={generalInfo.heating.other_type}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, heating: { ...generalInfo.heating, other_type: e.target.value } })}
                      />
                    )}
                  </div>

                  {/* Eau chaude */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Eau chaude</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Type d'eau chaude</Label>
                        <Select
                          value={generalInfo.hot_water.type}
                          onValueChange={(value: "individuelle" | "collective") => setGeneralInfo({ ...generalInfo, hot_water: { ...generalInfo.hot_water, type: value } })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individuelle">Individuelle</SelectItem>
                            <SelectItem value="collective">Collective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {generalInfo.hot_water.type === "individuelle" && (
                        <div>
                          <Label>Type de combustible</Label>
                          <Select
                            value={generalInfo.hot_water.fuel_type}
                            onValueChange={(value: "electrique" | "gaz" | "fioul" | "autre") => setGeneralInfo({ ...generalInfo, hot_water: { ...generalInfo.hot_water, fuel_type: value } })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electrique">Électrique</SelectItem>
                              <SelectItem value="gaz">Gaz</SelectItem>
                              <SelectItem value="fioul">Fioul</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    {generalInfo.hot_water.fuel_type === "autre" && (
                      <Input
                        placeholder="Précisez le type"
                        value={generalInfo.hot_water.other_type}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, hot_water: { ...generalInfo.hot_water, other_type: e.target.value } })}
                      />
                    )}
                  </div>

                  {/* Compteurs */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Compteurs</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Compteur électrique</Label>
                          <Input
                            placeholder="N° du compteur"
                            value={generalInfo.meters.electricity.number}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, meters: { ...generalInfo.meters, electricity: { ...generalInfo.meters.electricity, number: e.target.value } } })}
                          />
                        </div>
                        <div>
                          <Label>Relevé heure pleine</Label>
                          <Input
                            placeholder="Relevé"
                            value={generalInfo.meters.electricity.full_hour}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, meters: { ...generalInfo.meters, electricity: { ...generalInfo.meters.electricity, full_hour: e.target.value } } })}
                          />
                        </div>
                        <div>
                          <Label>Relevé heure creuse (Optionnel)</Label>
                          <Input
                            placeholder="Relevé"
                            value={generalInfo.meters.electricity.off_peak}
                            onChange={(e) => setGeneralInfo({ ...generalInfo, meters: { ...generalInfo.meters, electricity: { ...generalInfo.meters.electricity, off_peak: e.target.value } } })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Compteur gaz</Label>
                          <div className="space-y-2">
                            <Input
                              placeholder="N° du compteur"
                              value={generalInfo.meters.gas.number}
                              onChange={(e) => setGeneralInfo({ ...generalInfo, meters: { ...generalInfo.meters, gas: { ...generalInfo.meters.gas, number: e.target.value } } })}
                            />
                            <Input
                              placeholder="Relevé"
                              value={generalInfo.meters.gas.reading}
                              onChange={(e) => setGeneralInfo({ ...generalInfo, meters: { ...generalInfo.meters, gas: { ...generalInfo.meters.gas, reading: e.target.value } } })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Compteur eau</Label>
                          <div className="space-y-2">
                            <Input
                              placeholder="N° du compteur"
                              value={generalInfo.meters.water.number}
                              onChange={(e) => setGeneralInfo({ ...generalInfo, meters: { ...generalInfo.meters, water: { ...generalInfo.meters.water, number: e.target.value } } })}
                            />
                            <Input
                              placeholder="Relevé"
                              value={generalInfo.meters.water.reading}
                              onChange={(e) => setGeneralInfo({ ...generalInfo, meters: { ...generalInfo.meters, water: { ...generalInfo.meters.water, reading: e.target.value } } })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clés */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Clés</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Clés d'entrée</Label>
                        <Input
                          type="number"
                          value={generalInfo.keys.entrance}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, keys: { ...generalInfo.keys, entrance: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                      <div>
                        <Label>Clés immeuble/portail</Label>
                        <Input
                          type="number"
                          value={generalInfo.keys.building}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, keys: { ...generalInfo.keys, building: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                      <div>
                        <Label>Clés parking</Label>
                        <Input
                          type="number"
                          value={generalInfo.keys.parking}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, keys: { ...generalInfo.keys, parking: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                      <div>
                        <Label>Clés boîte aux lettres</Label>
                        <Input
                          type="number"
                          value={generalInfo.keys.mailbox}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, keys: { ...generalInfo.keys, mailbox: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                      <div>
                        <Label>Clés cave</Label>
                        <Input
                          type="number"
                          value={generalInfo.keys.cellar}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, keys: { ...generalInfo.keys, cellar: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                      <div>
                        <Label>Autre type de clés</Label>
                        <Input
                          type="number"
                          value={generalInfo.keys.other}
                          onChange={(e) => setGeneralInfo({ ...generalInfo, keys: { ...generalInfo.keys, other: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                    </div>
                    {generalInfo.keys.other > 0 && (
                      <Input
                        placeholder="Précisez le type de clés"
                        value={generalInfo.keys.other_type}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, keys: { ...generalInfo.keys, other_type: e.target.value } })}
                      />
                    )}
                  </div>

                  {/* Commentaire général */}
                  <div>
                    <Label>Commentaire général</Label>
                    <Textarea
                      placeholder="Commentaires généraux sur l'état des lieux..."
                      value={generalInfo.general_comment}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, general_comment: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Aperçu de l'état des lieux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Type :</span> {generalInfo.type === "entree" ? "Entrée" : "Sortie"}
                    </div>
                    <div>
                      <span className="font-medium">Date :</span> {generalInfo.date || "Non renseignée"}
                    </div>
                    <div>
                      <span className="font-medium">Adresse :</span> {generalInfo.address || "Non renseignée"}
                    </div>
                    <div>
                      <span className="font-medium">Propriétaire :</span> {generalInfo.owner.first_name} {generalInfo.owner.last_name}
                    </div>
                    <div>
                      <span className="font-medium">Locataire :</span> {generalInfo.tenant.first_name} {generalInfo.tenant.last_name}
                    </div>
                    <div>
                      <span className="font-medium">Pièces :</span> {rooms.length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={saveDigitalState} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline" onClick={() => setDigitalMode(false)} className="w-full">
                    Annuler
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Dialog pour ajouter une pièce */}
          <Dialog open={showAddRoomDialog} onOpenChange={setShowAddRoomDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une pièce</DialogTitle>
                <DialogDescription>
                  Choisissez le type de pièce et donnez-lui un nom
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Catégorie de pièce</Label>
                  <Select
                    value={newRoom.category}
                    onValueChange={(value: "main" | "water" | "annex") => setNewRoom({ ...newRoom, category: value, type: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Pièces principales</SelectItem>
                      <SelectItem value="water">Pièces d'eau</SelectItem>
                      <SelectItem value="annex">Pièces annexes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type de pièce</Label>
                  <Select
                    value={newRoom.type}
                    onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_CATEGORIES[newRoom.category].map((room) => (
                        <SelectItem key={room.value} value={room.value}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nom de la pièce</Label>
                  <Input
                    placeholder="Ex: Chambre principale"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddRoomDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={addRoom}>
                  Ajouter cette pièce
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
