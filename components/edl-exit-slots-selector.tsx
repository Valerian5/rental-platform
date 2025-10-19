"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CalendarIcon, Clock, CheckCircle } from "lucide-react"

interface EdlExitSlotsSelectorProps {
  leaseId: string
  slots: Array<{
    date: string
    start_time: string
    end_time: string
  }>
  onSlotSelected?: (slot: any) => void
}

export default function EdlExitSlotsSelector({ 
  leaseId, 
  slots, 
  onSlotSelected 
}: EdlExitSlotsSelectorProps) {
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const formatDate = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSlotSelection = async (slot: any) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      // Récupérer le token Supabase pour authentifier la requête côté API
      let headers: Record<string, string> = { "Content-Type": "application/json" }
      try {
        const { supabase } = await import("@/lib/supabase")
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (token) headers["Authorization"] = `Bearer ${token}`
      } catch {}

      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/select-slot`, {
        method: "POST",
        headers,
        body: JSON.stringify({ slot }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sélection")
      }

      const result = await response.json()
      setSelectedSlot(slot)
      toast.success("Créneau sélectionné avec succès !")
      
      if (onSlotSelected) {
        onSlotSelected(slot)
      }
      
      // Recharger la page pour mettre à jour l'état complet
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Erreur sélection créneau:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sélection")
    } finally {
      setIsLoading(false)
    }
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Aucun créneau disponible pour l'instant.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choisissez un créneau pour l'état des lieux de sortie
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez le créneau qui vous convient le mieux
        </p>
      </div>

      <div className="grid gap-3">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot && 
            selectedSlot.date === slot.date && 
            selectedSlot.start_time === slot.start_time

          return (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? "ring-2 ring-green-500 bg-green-50" 
                  : "hover:ring-2 hover:ring-blue-500 hover:bg-blue-50"
              }`}
              onClick={() => !isSelected && handleSlotSelection(slot)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <CalendarIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDate(slot.date, slot.start_time)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {slot.start_time} - {slot.end_time}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isSelected ? (
                      <Badge variant="default" className="bg-green-600">
                        Sélectionné
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSlotSelection(slot)
                        }}
                      >
                        {isLoading ? "Sélection..." : "Choisir"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedSlot && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="font-medium text-green-800">
                Créneau confirmé
              </p>
              <p className="text-sm text-green-600">
                {formatDate(selectedSlot.date, selectedSlot.start_time)} - {selectedSlot.start_time} à {selectedSlot.end_time}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
