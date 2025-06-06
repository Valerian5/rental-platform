"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, User, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { TenantVisitSlotCalendar } from "@/components/tenant-visit-slot-calendar"

interface VisitSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  is_group_visit: boolean
  current_bookings: number
  is_available: boolean
}

interface Application {
  id: string
  status: string
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    property_images: Array<{ id: string; url: string; is_primary: boolean }>
  }
  owner: {
    first_name: string
    last_name: string
  }
}

export default function SelectVisitSlotPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [availableSlots, setAvailableSlots] = useState<VisitSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    loadApplicationAndSlots()
  }, [applicationId])

  const loadApplicationAndSlots = async () => {
    try {
      setLoading(true)

      // Vérifier l'authentification
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "tenant") {
        toast.error("Vous devez être connecté en tant que locataire")
        router.push("/login")
        return
      }

      // Charger les détails de la candidature
      const appResponse = await fetch(`/api/applications/${applicationId}`, {
        headers: { "Content-Type": "application/json" },
      })

      if (!appResponse.ok) {
        throw new Error("Candidature introuvable")
      }

      const appData = await appResponse.json()

      if (appData.application.status !== "visit_proposed") {
        toast.error("Cette candidature n'est pas au stade de sélection de créneaux")
        router.push("/tenant/applications")
        return
      }

      setApplication(appData.application)

      // Charger les créneaux disponibles
      const slotsResponse = await fetch(`/api/applications/${applicationId}/available-slots`, {
        headers: { "Content-Type": "application/json" },
      })

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setAvailableSlots(slotsData.slots || [])
      } else {
        throw new Error("Erreur lors du chargement des créneaux")
      }
    } catch (error) {
      console.error("❌ Erreur chargement:", error)
      toast.error("Erreur lors du chargement")
      router.push("/tenant/applications")
    } finally {
      setLoading(false)
    }
  }

  const handleSlotSelected = (slotId: string) => {
    setSelectedSlot(slotId)
  }

  const handleConfirmSlot = async () => {
    if (!selectedSlot) {
      toast.error("Veuillez sélectionner un créneau")
      return
    }

    try {
      setConfirming(true)

      const response = await fetch(`/api/applications/${applicationId}/choose-visit-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: selectedSlot }),
      })

      if (response.ok) {
        toast.success("Créneau de visite confirmé !")
        router.push("/tenant/applications")
      } else {
        const errorData = await response.json()
        console.error("❌ Erreur API:", errorData)
        throw new Error(errorData.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("❌ Erreur confirmation:", error)
      toast.error("Erreur lors de la confirmation du créneau")
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement des créneaux disponibles...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Candidature introuvable</h3>
          <Button onClick={() => router.push("/tenant/applications")}>Retour à mes candidatures</Button>
        </div>
      </div>
    )
  }

  const primaryImage =
    application.property.property_images?.find((img) => img.is_primary) || application.property.property_images?.[0]

  return (
    <div className="container mx-auto py-6">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/tenant/applications")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Choisir un créneau de visite</h1>
          <p className="text-muted-foreground">Sélectionnez le créneau qui vous convient le mieux</p>
        </div>
      </div>

      {/* Informations du bien */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={primaryImage?.url || "/placeholder.svg?height=96&width=128&text=Pas d'image"}
                alt={application.property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=96&width=128&text=Image non disponible"
                }}
              />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-2">{application.property.title}</h3>
              <div className="flex items-center text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>
                  {application.property.address}, {application.property.city}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Propriétaire : {application.owner.first_name} {application.owner.last_name}
                  </span>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {application.property.price} €/mois
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier de sélection */}
      <TenantVisitSlotCalendar
        visitSlots={availableSlots}
        selectedSlot={selectedSlot}
        onSlotSelected={handleSlotSelected}
      />

      {/* Bouton de confirmation */}
      {availableSlots.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleConfirmSlot}
            disabled={!selectedSlot || confirming}
            size="lg"
            className="min-w-[250px]"
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirmation en cours...
              </>
            ) : selectedSlot ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer ce créneau
              </>
            ) : (
              "Sélectionnez un créneau"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
