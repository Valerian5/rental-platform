"use client"

import { Button } from "@/components/ui/button"
import { FileText, Send, Save } from "lucide-react"

interface ActionButtonsProps {
  onSave: () => void
  onGeneratePDF: () => void
  onSend: () => void
  saving: boolean
  disabled?: boolean
}

export function ActionButtons({ onSave, onGeneratePDF, onSend, saving, disabled = false }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-600">
        {saving ? "Sauvegarde en cours..." : "Toutes les modifications sont sauvegardées automatiquement"}
      </div>
      
      <div className="flex items-center space-x-3">
        <Button
          onClick={onSave}
          disabled={disabled || saving}
          variant="outline"
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
        
        <Button
          onClick={onGeneratePDF}
          disabled={disabled}
          variant="outline"
          size="sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Générer PDF
        </Button>
        
        <Button
          onClick={onSend}
          disabled={disabled}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          Envoyer au locataire
        </Button>
      </div>
    </div>
  )
}
