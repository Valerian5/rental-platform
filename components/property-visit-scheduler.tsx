"use client"

import { useState } from "react"
import { VisitScheduler } from "./visit-scheduler"

interface PropertyVisitSchedulerProps {
  onSlotsChange: (slots: any[]) => void
  initialSlots?: any[]
}

export function PropertyVisitScheduler({ onSlotsChange, initialSlots = [] }: PropertyVisitSchedulerProps) {
  const [visitSlots, setVisitSlots] = useState(initialSlots)

  const handleSlotsChange = (newSlots: any[]) => {
    setVisitSlots(newSlots)
    onSlotsChange(newSlots)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Créneaux de visite</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les créneaux de visite pour votre bien. Vous pourrez les modifier à tout moment.
        </p>
      </div>

      <VisitScheduler visitSlots={visitSlots} onSlotsChange={handleSlotsChange} mode="creation" />
    </div>
  )
}
