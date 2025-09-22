"use client"

import { useState, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface AddReceiptDialogProps {
  onReceiptAdded?: () => void
}

export interface AddReceiptDialogRef {
  openDialog: (expenseId: string) => void
}

export const AddReceiptDialog = forwardRef<AddReceiptDialogRef, AddReceiptDialogProps>(
  ({ onReceiptAdded }, ref) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState("")
  const [expenseInfo, setExpenseInfo] = useState<any>(null)

  // Exposer la méthode openDialog via la ref
  useImperativeHandle(ref, () => ({
    openDialog: (expenseId: string) => {
      setCurrentExpenseId(expenseId)
      setReceiptUrl("")
      setOpen(true)
      loadExpenseInfo(expenseId)
    }
  }))

  const loadExpenseInfo = async (expenseId: string) => {
    try {
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch(`/api/expenses/${expenseId}`, {
        headers: { 
          "Authorization": `Bearer ${sessionData.session.access_token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setExpenseInfo(data.expense)
        setReceiptUrl(data.expense.receipt_url || "")
      } else {
        toast.error(data.error || "Erreur lors du chargement de la dépense")
      }
    } catch (error) {
      console.error("Erreur chargement dépense:", error)
      toast.error("Erreur lors du chargement de la dépense")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentExpenseId) return

    if (!receiptUrl.trim()) {
      toast.error("Veuillez saisir une URL de justificatif")
      return
    }

    try {
      setIsLoading(true)

      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch(`/api/expenses/${currentExpenseId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          receipt_url: receiptUrl.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Justificatif ajouté avec succès")
        setOpen(false)
        onReceiptAdded?.()
      } else {
        toast.error(data.error || "Erreur lors de l'ajout du justificatif")
      }
    } catch (error) {
      console.error("Erreur ajout justificatif:", error)
      toast.error("Erreur lors de l'ajout du justificatif")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Ici vous pourriez implémenter l'upload vers un service de stockage
    // Pour l'instant, on simule avec une URL
    toast.info("Fonctionnalité d'upload de fichier en cours de développement")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un justificatif</DialogTitle>
          <DialogDescription>
            Ajoutez un justificatif pour cette dépense
          </DialogDescription>
        </DialogHeader>

        {expenseInfo && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dépense concernée</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <p className="font-medium">{expenseInfo.description}</p>
                <p className="text-sm text-muted-foreground">
                  {expenseInfo.amount?.toLocaleString('fr-FR')} € - {new Date(expenseInfo.date).toLocaleDateString('fr-FR')}
                </p>
                {expenseInfo.property && (
                  <p className="text-sm text-muted-foreground">
                    {expenseInfo.property.title}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL du justificatif */}
          <div className="space-y-2">
            <Label htmlFor="receipt_url">URL du justificatif *</Label>
            <Input
              id="receipt_url"
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://exemple.com/justificatif.pdf"
            />
            <p className="text-xs text-muted-foreground">
              Saisissez l'URL du justificatif (PDF, image, etc.)
            </p>
          </div>

          {/* Upload de fichier (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="file_upload">Ou téléchargez un fichier</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file_upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formats acceptés : PDF, JPG, PNG (max 10MB)
            </p>
          </div>

          {/* Aperçu du justificatif existant */}
          {expenseInfo?.receipt_url && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  Justificatif existant
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <a 
                    href={expenseInfo.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 hover:underline"
                  >
                    Voir le justificatif actuel
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !receiptUrl.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Ajout en cours..." : "Ajouter le justificatif"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
