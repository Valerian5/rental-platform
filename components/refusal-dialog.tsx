"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

interface RefusalDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string, type: string) => void
}

export function RefusalDialog({ open, onClose, onConfirm }: RefusalDialogProps) {
  const [refusalType, setRefusalType] = useState("insufficient_income")
  const [customReason, setCustomReason] = useState("")

  const handleConfirm = () => {
    const reason = refusalType === "other" ? customReason : ""
    onConfirm(reason, refusalType)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Motif de refus</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Sélectionnez un motif</Label>
            <RadioGroup value={refusalType} onValueChange={setRefusalType} className="mt-2">
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="insufficient_income" id="insufficient_income" />
                <Label htmlFor="insufficient_income">Revenus insuffisants</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="incomplete_file" id="incomplete_file" />
                <Label htmlFor="incomplete_file">Dossier incomplet</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="missing_guarantor" id="missing_guarantor" />
                <Label htmlFor="missing_guarantor">Absence de garant</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="unstable_situation" id="unstable_situation" />
                <Label htmlFor="unstable_situation">Situation professionnelle instable</Label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Autre motif</Label>
              </div>
            </RadioGroup>
          </div>

          {refusalType === "other" && (
            <div>
              <Label htmlFor="custom-reason">Précisez le motif</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Veuillez préciser le motif du refus..."
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={refusalType === "other" && !customReason.trim()}
          >
            Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
