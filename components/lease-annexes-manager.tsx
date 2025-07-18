"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileText, Plus, Download, Trash2, Upload, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface Annexe {
  id: string
  name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

interface LeaseAnnexesManagerProps {
  leaseId: string
}

export function LeaseAnnexesManager({ leaseId }: LeaseAnnexesManagerProps) {
  const [annexes, setAnnexes] = useState<Annexe[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadAnnexes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leases/${leaseId}/annexes`)

      if (response.ok) {
        const data = await response.json()
        setAnnexes(data.annexes || [])
      }
    } catch (error) {
      console.error("Erreur chargement annexes:", error)
      toast.error("Erreur lors du chargement des annexes")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const file = formData.get("file") as File

    if (!file) {
      toast.error("Veuillez sélectionner un fichier")
      return
    }

    try {
      setUploading(true)

      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("leaseId", leaseId)

      const response = await fetch(`/api/leases/${leaseId}/annexes`, {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      const data = await response.json()
      toast.success("Annexe ajoutée avec succès")
      setIsDialogOpen(false)
      await loadAnnexes()
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'ajout de l'annexe")
    } finally {
      setUploading(false)
    }
  }

  const deleteAnnexe = async (annexeId: string) => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/annexes/${annexeId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression")
      }

      toast.success("Annexe supprimée avec succès")
      await loadAnnexes()
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const downloadAnnexe = async (annexe: Annexe) => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/annexes/${annexe.id}`)

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = annexe.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  useEffect(() => {
    loadAnnexes()
  }, [leaseId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement des annexes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Annexes du bail
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une annexe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une annexe</DialogTitle>
                <DialogDescription>Téléchargez un document à joindre au bail (PDF, DOC, JPG, PNG)</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file">Fichier</Label>
                  <Input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {annexes.length > 0 ? (
          <div className="space-y-3">
            {annexes.map((annexe) => (
              <div key={annexe.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">{annexe.name}</p>
                    <p className="text-sm text-gray-600">
                      {(annexe.file_size / 1024).toFixed(1)} KB •{" "}
                      {new Date(annexe.uploaded_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadAnnexe(annexe)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer l'annexe</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer "{annexe.name}" ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAnnexe(annexe.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucune annexe ajoutée pour ce bail</p>
            <p className="text-sm text-gray-500">
              Les annexes peuvent inclure des diagnostics, des états des lieux, des inventaires, etc.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
