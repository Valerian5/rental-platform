"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  Settings
} from "lucide-react"
import { toast } from "sonner"

interface IncidentPriorityManagerProps {
  incidentId: string
  currentPriority: string
  onPriorityChange: (priority: string) => void
  isOwner?: boolean
}

export default function IncidentPriorityManager({ 
  incidentId, 
  currentPriority, 
  onPriorityChange,
  isOwner = false 
}: IncidentPriorityManagerProps) {
  const [selectedPriority, setSelectedPriority] = useState(currentPriority)
  const [saving, setSaving] = useState(false)

  const priorityOptions = [
    { value: "low", label: "Faible", icon: CheckCircle, color: "text-green-600" },
    { value: "medium", label: "Moyen", icon: Clock, color: "text-yellow-600" },
    { value: "high", label: "Élevé", icon: AlertCircle, color: "text-orange-600" },
    { value: "urgent", label: "Urgent", icon: AlertTriangle, color: "text-red-600" },
  ]

  const getPriorityIcon = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority)
    if (!option) return <Clock className="h-4 w-4 text-gray-600" />
    
    const IconComponent = option.icon
    return <IconComponent className={`h-4 w-4 ${option.color}`} />
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>
      case "high": return <Badge className="bg-orange-600">Élevé</Badge>
      case "medium": return <Badge variant="secondary">Moyen</Badge>
      case "low": return <Badge variant="outline">Faible</Badge>
      default: return <Badge variant="outline">{priority}</Badge>
    }
  }

  const handleSavePriority = async () => {
    if (selectedPriority === currentPriority) return

    try {
      setSaving(true)
      
      const response = await fetch(`/api/incidents/${incidentId}/priority`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority: selectedPriority }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la priorité")
      }

      onPriorityChange(selectedPriority)
      toast.success("Priorité mise à jour avec succès")
    } catch (error) {
      console.error("❌ Erreur mise à jour priorité:", error)
      toast.error("Erreur lors de la mise à jour de la priorité")
    } finally {
      setSaving(false)
    }
  }

  if (!isOwner) {
    // Pour les locataires, afficher seulement la priorité actuelle
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Priorité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {getPriorityIcon(currentPriority)}
            <span className="font-medium">{priorityOptions.find(opt => opt.value === currentPriority)?.label || currentPriority}</span>
            {getPriorityBadge(currentPriority)}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gestion de la priorité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Priorité actuelle :</span>
          {getPriorityIcon(currentPriority)}
          <span className="font-medium">{priorityOptions.find(opt => opt.value === currentPriority)?.label || currentPriority}</span>
          {getPriorityBadge(currentPriority)}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Modifier la priorité :</label>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une priorité" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${option.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedPriority !== currentPriority && (
          <Button 
            onClick={handleSavePriority} 
            disabled={saving}
            className="w-full"
          >
            {saving ? "Mise à jour..." : "Mettre à jour la priorité"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
