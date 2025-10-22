"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Calendar, AlertTriangle, CheckCircle } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

interface Lease {
  id: string
  property: {
    id: string
    title: string
    address: string
  }
}

export default function TenantDocumentsUploadPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<Lease[]>([])
  const [selectedLease, setSelectedLease] = useState("")
  const [documentType, setDocumentType] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          router.push("/login")
          return
        }

        setCurrentUser(user)
        await loadLeases()
        
        // Pré-remplir le type de document depuis l'URL
        const typeFromUrl = searchParams.get("type")
        if (typeFromUrl) {
          setDocumentType(typeFromUrl)
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      }
    }

    fetchData()
  }, [router, searchParams])

  const loadLeases = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch("/api/leases/tenant", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()
      if (data.success) {
        setLeases(data.leases || [])
        if (data.leases?.length > 0) {
          setSelectedLease(data.leases[0].id)
        }
      }
    } catch (error) {
      console.error("❌ Erreur récupération baux:", error)
    }
  }

  const documentTypes = [
    {
      value: "insurance",
      label: "Attestation d'assurance habitation",
      description: "Document obligatoire renouvelé chaque année",
      required: true
    },
    {
      value: "boiler_service",
      label: "Certificat d'entretien annuel de la chaudière",
      description: "Si chaudière individuelle - renouvelé chaque année",
      required: false
    },
    {
      value: "chimney_sweep",
      label: "Certificat de ramonage",
      description: "Si conduit, poêle, cheminée - 1 à 2 fois par an selon arrêté préfectoral",
      required: false
    }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-remplir le titre si vide
      if (!title) {
        const docType = documentTypes.find(dt => dt.value === documentType)
        if (docType) {
          setTitle(docType.label)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !selectedLease || !documentType) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsUploading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const formData = new FormData()
      formData.append("file", file)
      formData.append("lease_id", selectedLease)
      formData.append("document_type", documentType)
      formData.append("title", title)
      formData.append("description", description)
      if (expiryDate) formData.append("expiry_date", expiryDate)

      const res = await fetch("/api/documents/tenant", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Document uploadé avec succès")
        router.push("/tenant/rental-management/documents")
      } else {
        toast.error(data.error || "Erreur lors de l'upload")
      }
    } catch (error) {
      console.error("❌ Erreur upload:", error)
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setIsUploading(false)
    }
  }

  const selectedDocType = documentTypes.find(dt => dt.value === documentType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Transmettre un document obligatoire</h2>
        <p className="text-muted-foreground">
          Uploadez les documents requis pour votre logement
        </p>
      </div>

      {/* Types de documents requis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Documents obligatoires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documentTypes.map((docType) => (
              <div key={docType.value} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{docType.label}</h4>
                    {docType.required && (
                      <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{docType.description}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'upload */}
      <Card>
        <CardHeader>
          <CardTitle>Nouveau document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sélection du bail */}
            <div>
              <Label htmlFor="lease">Bail concerné *</Label>
              <Select value={selectedLease} onValueChange={setSelectedLease} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un bail" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {lease.property.title} - {lease.property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type de document */}
            <div>
              <Label htmlFor="documentType">Type de document *</Label>
              <Select value={documentType} onValueChange={setDocumentType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((docType) => (
                    <SelectItem key={docType.value} value={docType.value}>
                      {docType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Titre */}
            <div>
              <Label htmlFor="title">Titre du document *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Attestation d'assurance 2024"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>

            {/* Date d'expiration */}
            <div>
              <Label htmlFor="expiryDate">Date d'expiration (optionnel)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Si renseignée, vous serez alerté avant l'expiration
              </p>
            </div>

            {/* Fichier */}
            <div>
              <Label htmlFor="file">Fichier *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Formats acceptés: PDF, JPG, PNG, DOC, DOCX (max 10MB)
              </p>
            </div>

            {/* Informations sur le type sélectionné */}
            {selectedDocType && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedDocType.label}</strong><br />
                  {selectedDocType.description}
                </AlertDescription>
              </Alert>
            )}

            {/* Boutons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isUploading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Transmettre le document
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
