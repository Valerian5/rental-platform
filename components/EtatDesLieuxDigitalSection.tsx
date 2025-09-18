import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Camera, CheckCircle, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

interface EtatDesLieuxDigitalSectionProps {
  leaseId: string
  propertyId: string
  propertyData?: PropertyData
  leaseData: LeaseData
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

const STATE_LABELS = {
  absent: "Absent",
  M: "Mauvais état",
  P: "État passable", 
  B: "Bon état",
  TB: "Très bon état",
}

const getStateBadge = (state: string) => {
  const colors = {
    absent: "bg-gray-100 text-gray-800",
    M: "bg-red-100 text-red-800",
    P: "bg-orange-100 text-orange-800", 
    B: "bg-green-100 text-green-800",
    TB: "bg-blue-100 text-blue-800",
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[state as keyof typeof colors] || colors.absent}`}>
      {STATE_LABELS[state as keyof typeof STATE_LABELS] || state}
    </span>
  )
}

export function EtatDesLieuxDigitalSection({
  leaseId,
  propertyId,
  propertyData,
  leaseData,
}: EtatDesLieuxDigitalSectionProps) {
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
      electricity: { number: "", full_hour: "", off_peak: "" },
      gas: { number: "", reading: "" },
      water: { number: "", reading: "" },
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
  const [hasLoadedData, setHasLoadedData] = useState(false)

  const initializeRooms = () => {
    setRooms([
      {
        id: "sejour",
        name: "Séjour",
        type: "main",
        elements: Object.fromEntries(
          Object.keys(ELEMENT_LABELS).map((k) => [k, { state: "B", comment: "" }])
        ) as RoomState["elements"],
        comment: "",
        photos: [],
      },
    ])
  }

  const removeRoom = (roomId: string) => {
    setRooms(rooms.filter((room) => room.id !== roomId))
    if (currentRoomIndex >= rooms.length - 1) {
      setCurrentRoomIndex(Math.max(0, rooms.length - 2))
    }
  }

  const updateRoomElement = (
    roomId: string,
    element: string,
    state: string,
    comment: string
  ) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              elements: {
                ...room.elements,
                [element]: { state: state as any, comment },
              },
            }
          : room
      )
    )
  }

  const addRoom = () => {
    if (!newRoom.type || !newRoom.name) return
    const newRoomState: RoomState = {
      id: `${newRoom.type}-${Date.now()}`,
      name: newRoom.name,
      type: newRoom.category,
      elements: Object.fromEntries(
        Object.keys(ELEMENT_LABELS).map((k) => [k, { state: "B", comment: "" }])
      ) as RoomState["elements"],
      comment: "",
      photos: [],
    }
    setRooms([...rooms, newRoomState])
    setNewRoom({ category: "main", type: "", name: "" })
    setShowAddRoomDialog(false)
  }

  const handlePhotoUpload = async (roomId: string, files: FileList) => {
    try {
      const roomIndex = rooms.findIndex(room => room.id === roomId)
      if (roomIndex === -1) return

      const currentRoom = rooms[roomIndex]
      if (currentRoom.photos.length + files.length > 5) {
        toast.error("Maximum 5 photos par pièce")
        return
      }

      const formData = new FormData()
      formData.append('roomId', roomId)
      Array.from(files).forEach((file, index) => {
        formData.append(`photos`, file)
      })

      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/photos`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Erreur lors de l'upload")

      const result = await response.json()
      
      // Mettre à jour les photos de la pièce
      setRooms(rooms.map(room => 
        room.id === roomId 
          ? { ...room, photos: [...room.photos, ...result.photoUrls] }
          : room
      ))

      toast.success(`${files.length} photo(s) ajoutée(s)`)
    } catch (error) {
      console.error("Erreur upload photos:", error)
      toast.error("Erreur lors de l'upload des photos")
    }
  }

  const removePhoto = (roomId: string, photoIndex: number) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, photos: room.photos.filter((_, index) => index !== photoIndex) }
        : room
    ))
  }

  const loadDigitalState = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/digital`)
      if (response.ok) {
        const data = await response.json()
        if (data.general_info) {
          setGeneralInfo(data.general_info)
        }
        if (data.rooms && data.rooms.length > 0) {
          setRooms(data.rooms)
        }
        setHasLoadedData(true)
      } else {
        setHasLoadedData(true)
      }
    } catch (error) {
      console.error("Erreur chargement:", error)
      setHasLoadedData(true)
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

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde")

      toast.success("État des lieux numérique sauvegardé")
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  useEffect(() => {
    loadDigitalState()
  }, [])

  useEffect(() => {
    if (hasLoadedData && rooms.length === 0) {
      initializeRooms()
    }
  }, [hasLoadedData])

  useEffect(() => {
    if (leaseData) {
      setGeneralInfo((prev) => ({
        ...prev,
        address: leaseData.adresse_logement,
        owner: {
          ...prev.owner,
          first_name: leaseData.bailleur_nom_prenom.split(" ")[0] || "",
          last_name: leaseData.bailleur_nom_prenom.split(" ").slice(1).join(" ") || "",
        },
        tenant: {
          ...prev.tenant,
          first_name: leaseData.locataire_nom_prenom.split(" ")[0] || "",
          last_name: leaseData.locataire_nom_prenom.split(" ").slice(1).join(" ") || "",
        },
      }))
    }
  }, [leaseData])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contenu principal */}
      <div className="lg:col-span-2 space-y-6">
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
                  onValueChange={(value: "entree" | "sortie") =>
                    setGeneralInfo({ ...generalInfo, type: value })
                  }
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
                <Label>Date</Label>
                <Input
                  type="date"
                  value={generalInfo.date}
                  onChange={(e) =>
                    setGeneralInfo({ ...generalInfo, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Adresse du logement</Label>
              <Input
                value={generalInfo.address}
                onChange={(e) =>
                  setGeneralInfo({ ...generalInfo, address: e.target.value })
                }
              />
            </div>

            {/* Informations bailleur */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Bailleur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input
                    value={generalInfo.owner.first_name}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        owner: { ...generalInfo.owner, first_name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={generalInfo.owner.last_name}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        owner: { ...generalInfo.owner, last_name: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={generalInfo.owner.email}
                  onChange={(e) =>
                    setGeneralInfo({
                      ...generalInfo,
                      owner: { ...generalInfo.owner, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mandataire"
                  checked={generalInfo.owner.is_mandataire}
                  onChange={(e) =>
                    setGeneralInfo({
                      ...generalInfo,
                      owner: { ...generalInfo.owner, is_mandataire: e.target.checked },
                    })
                  }
                />
                <Label htmlFor="mandataire">
                  Le bailleur est représenté par un mandataire
                </Label>
              </div>
              {generalInfo.owner.is_mandataire && (
                <div>
                  <Label>Adresse du mandataire</Label>
                  <Textarea
                    value={generalInfo.owner.mandataire_address}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        owner: {
                          ...generalInfo.owner,
                          mandataire_address: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Informations locataire */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Locataire</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input
                    value={generalInfo.tenant.first_name}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        tenant: { ...generalInfo.tenant, first_name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={generalInfo.tenant.last_name}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        tenant: { ...generalInfo.tenant, last_name: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={generalInfo.tenant.email}
                  onChange={(e) =>
                    setGeneralInfo({
                      ...generalInfo,
                      tenant: { ...generalInfo.tenant, email: e.target.value },
                    })
                  }
                />
              </div>
            </div>

          </CardContent>
        </Card>

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
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Notez l'état de chaque élément de cette pièce :</p>
              <div className="flex flex-wrap gap-4 text-xs text-blue-700">
                <span><strong>Absent</strong> - Élément absent</span>
                <span><strong>M</strong> - Mauvais état</span>
                <span><strong>P</strong> - État passable</span>
                <span><strong>B</strong> - Bon état</span>
                <span><strong>TB</strong> - Très bon état</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune pièce configurée</p>
                <p className="text-sm text-gray-500">
                  Ajoutez des pièces pour commencer l'état des lieux
                </p>
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
                    {/* En-tête pièce */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {rooms[currentRoomIndex].name}
                      </h3>
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
                      {Object.entries(ELEMENT_LABELS).map(([key, label]) => {
                        const element = rooms[currentRoomIndex].elements[key as keyof RoomState['elements']]

                        return (
                          <div key={key} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium">{label}</Label>
                              <Select
                                value={element.state}
                                onValueChange={(value) =>
                                  updateRoomElement(
                                    rooms[currentRoomIndex].id,
                                    key,
                                    value as "absent" | "M" | "P" | "B" | "TB",
                                    element.comment
                                  )
                                }
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
                              value={element.comment}
                              onChange={(e) =>
                                updateRoomElement(
                                  rooms[currentRoomIndex].id,
                                  key,
                                  element.state,
                                  e.target.value
                                )
                              }
                              className="mt-2"
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Commentaire sur la pièce */}
                    <div>
                      <Label>Commentaire sur cette pièce</Label>
                      <Textarea
                        placeholder="Ajoutez des précisions sur un élément ou une description d'un élément non listé..."
                        value={rooms[currentRoomIndex].comment}
                        onChange={(e) =>
                          setRooms(
                            rooms.map((r, i) =>
                              i === currentRoomIndex
                                ? { ...r, comment: e.target.value }
                                : r
                            )
                          )
                        }
                      />
                    </div>

                    {/* Photos de la pièce */}
                    <div>
                      <Label>Photos de la pièce</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Photos justificatives ({rooms[currentRoomIndex].photos.length}/5)
                      </p>
                      
                      {/* Zone d'upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              handlePhotoUpload(rooms[currentRoomIndex].id, e.target.files)
                            }
                          }}
                          className="hidden"
                          id={`photo-upload-${rooms[currentRoomIndex].id}`}
                        />
                        <label 
                          htmlFor={`photo-upload-${rooms[currentRoomIndex].id}`}
                          className="cursor-pointer block"
                        >
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">Cliquez pour ajouter des photos</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP (max 5MB)</p>
                        </label>
                      </div>

                      {/* Affichage des photos */}
                      {rooms[currentRoomIndex].photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {rooms[currentRoomIndex].photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <button
                                onClick={() => removePhoto(rooms[currentRoomIndex].id, index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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
                    onValueChange={(value: "individuel" | "collectif" | "pas_de_chauffage") =>
                      setGeneralInfo({
                        ...generalInfo,
                        heating: { ...generalInfo.heating, type: value },
                      })
                    }
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
                      onValueChange={(value: "electrique" | "gaz" | "fioul" | "autre") =>
                        setGeneralInfo({
                          ...generalInfo,
                          heating: { ...generalInfo.heating, fuel_type: value },
                        })
                      }
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
                  onChange={(e) =>
                    setGeneralInfo({
                      ...generalInfo,
                      heating: { ...generalInfo.heating, other_type: e.target.value },
                    })
                  }
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
                    onValueChange={(value: "individuelle" | "collective") =>
                      setGeneralInfo({
                        ...generalInfo,
                        hot_water: { ...generalInfo.hot_water, type: value },
                      })
                    }
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
                      onValueChange={(value: "electrique" | "gaz" | "fioul" | "autre") =>
                        setGeneralInfo({
                          ...generalInfo,
                          hot_water: { ...generalInfo.hot_water, fuel_type: value },
                        })
                      }
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
                  onChange={(e) =>
                    setGeneralInfo({
                      ...generalInfo,
                      hot_water: { ...generalInfo.hot_water, other_type: e.target.value },
                    })
                  }
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
                      onChange={(e) =>
                        setGeneralInfo({
                          ...generalInfo,
                          meters: {
                            ...generalInfo.meters,
                            electricity: {
                              ...generalInfo.meters.electricity,
                              number: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Relevé heure pleine</Label>
                    <Input
                      placeholder="Relevé"
                      value={generalInfo.meters.electricity.full_hour}
                      onChange={(e) =>
                        setGeneralInfo({
                          ...generalInfo,
                          meters: {
                            ...generalInfo.meters,
                            electricity: {
                              ...generalInfo.meters.electricity,
                              full_hour: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Relevé heure creuse (Optionnel)</Label>
                    <Input
                      placeholder="Relevé"
                      value={generalInfo.meters.electricity.off_peak}
                      onChange={(e) =>
                        setGeneralInfo({
                          ...generalInfo,
                          meters: {
                            ...generalInfo.meters,
                            electricity: {
                              ...generalInfo.meters.electricity,
                              off_peak: e.target.value,
                            },
                          },
                        })
                      }
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
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meters: {
                              ...generalInfo.meters,
                              gas: { ...generalInfo.meters.gas, number: e.target.value },
                            },
                          })
                        }
                      />
                      <Input
                        placeholder="Relevé"
                        value={generalInfo.meters.gas.reading}
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meters: {
                              ...generalInfo.meters,
                              gas: { ...generalInfo.meters.gas, reading: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Compteur eau</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="N° du compteur"
                        value={generalInfo.meters.water.number}
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meters: {
                              ...generalInfo.meters,
                              water: { ...generalInfo.meters.water, number: e.target.value },
                            },
                          })
                        }
                      />
                      <Input
                        placeholder="Relevé"
                        value={generalInfo.meters.water.reading}
                        onChange={(e) =>
                          setGeneralInfo({
                            ...generalInfo,
                            meters: {
                              ...generalInfo.meters,
                              water: { ...generalInfo.meters.water, reading: e.target.value },
                            },
                          })
                        }
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
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        keys: { ...generalInfo.keys, entrance: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Clés immeuble/portail</Label>
                  <Input
                    type="number"
                    value={generalInfo.keys.building}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        keys: { ...generalInfo.keys, building: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Clés parking</Label>
                  <Input
                    type="number"
                    value={generalInfo.keys.parking}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        keys: { ...generalInfo.keys, parking: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Clés boîte aux lettres</Label>
                  <Input
                    type="number"
                    value={generalInfo.keys.mailbox}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        keys: { ...generalInfo.keys, mailbox: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Clés cave</Label>
                  <Input
                    type="number"
                    value={generalInfo.keys.cellar}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        keys: { ...generalInfo.keys, cellar: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Autre type de clés</Label>
                  <Input
                    type="number"
                    value={generalInfo.keys.other}
                    onChange={(e) =>
                      setGeneralInfo({
                        ...generalInfo,
                        keys: { ...generalInfo.keys, other: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
              </div>
              {generalInfo.keys.other > 0 && (
                <Input
                  placeholder="Précisez le type de clés"
                  value={generalInfo.keys.other_type}
                  onChange={(e) =>
                    setGeneralInfo({
                      ...generalInfo,
                      keys: { ...generalInfo.keys, other_type: e.target.value },
                    })
                  }
                />
              )}
            </div>

            {/* Commentaire général */}
            <div>
              <Label>Commentaire général</Label>
              <Textarea
                placeholder="Commentaires généraux sur l'état des lieux..."
                value={generalInfo.general_comment}
                onChange={(e) =>
                  setGeneralInfo({ ...generalInfo, general_comment: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aperçu de l'état des lieux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Informations générales */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Type :</span>
                  <span className="text-gray-600">
                    {generalInfo.type === "entree" ? "Entrée" : "Sortie"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date :</span>
                  <span className="text-gray-600">
                    {generalInfo.date || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Adresse :</span>
                  <span className="text-gray-600 text-right">
                    {generalInfo.address || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Propriétaire :</span>
                  <span className="text-gray-600">
                    {generalInfo.owner.first_name} {generalInfo.owner.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Locataire :</span>
                  <span className="text-gray-600">
                    {generalInfo.tenant.first_name} {generalInfo.tenant.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pièces :</span>
                  <span className="text-gray-600">{rooms.length}</span>
                </div>
              </div>

              {/* Détail des pièces */}
              {rooms.length > 0 && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-3">Détail des pièces</h4>
                    <div className="space-y-3">
                      {rooms.map((room, index) => (
                        <div key={room.id} className="border rounded-lg p-3">
                          <h5 className="font-medium text-sm mb-2">{room.name}</h5>
                          
                          {/* Tableau des éléments */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-1">Élément</th>
                                  <th className="text-left py-1">Commentaire</th>
                                  <th className="text-center py-1">État</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(ELEMENT_LABELS).map(([key, label]) => {
                                  const element = room.elements[key as keyof typeof room.elements]
                                  return (
                                    <tr key={key} className="border-b">
                                      <td className="py-1 pr-2">{label}</td>
                                      <td className="py-1 pr-2 text-gray-600">
                                        {element.comment || "-"}
                                      </td>
                                      <td className="py-1 text-center">
                                        {getStateBadge(element.state)}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Commentaire de la pièce */}
                          {room.comment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <strong>Commentaire :</strong> {room.comment}
                            </div>
                          )}

                          {/* Photos de la pièce */}
                          {room.photos.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                Photos ({room.photos.length})
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                {room.photos.slice(0, 3).map((photo, photoIndex) => (
                                  <img
                                    key={photoIndex}
                                    src={photo}
                                    alt={`Photo ${photoIndex + 1}`}
                                    className="w-full h-16 object-cover rounded border"
                                  />
                                ))}
                                {room.photos.length > 3 && (
                                  <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                    +{room.photos.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
          </CardContent>
        </Card>
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
                onValueChange={(value: "main" | "water" | "annex") =>
                  setNewRoom({ ...newRoom, category: value, type: "" })
                }
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
            <Button onClick={addRoom}>Ajouter cette pièce</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


