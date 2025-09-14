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

  const roomCount = propertyData?.rooms || 1

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
          <div className="text-center py-8">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">État des lieux numérique</h3>
            <p className="text-gray-600 mb-4">
              Interface complète pour créer des états des lieux détaillés
            </p>
            <Button onClick={() => setDigitalMode(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Commencer l'état des lieux numérique
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}