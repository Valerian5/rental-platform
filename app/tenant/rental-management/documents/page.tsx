"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, Filter, Calendar, FileText, Upload, Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Document {
  id: string
  title: string
  type: string
  category: string
  file_url: string
  file_size?: number
  created_at: string
  uploaded_by: {
    id: string
    first_name: string
    last_name: string
  }
}

export default function TenantDocumentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          window.location.href = "/login"
          return
        }

        setCurrentUser(user)
        await loadDocuments()
        await loadRequiredDocuments()
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadDocuments = async () => {
    try {
      // Récupérer les documents via l'API avec token Bearer
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch("/api/documents/tenant", { 
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()

      if (data.success) {
        setDocuments(data.documents || [])
      } else {
        console.error("❌ Erreur récupération documents:", data.error)
        toast.error("Erreur lors du chargement des documents")
      }
    } catch (error) {
      console.error("❌ Erreur fetch documents:", error)
      toast.error("Erreur lors du chargement des documents")
    }
  }

  const loadRequiredDocuments = async () => {
    try {
      if (!currentUser?.id) return
      
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch("/api/documents/check-obsolescence", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId: currentUser.id })
      })
      const data = await res.json()
      if (data.success) {
        setRequiredDocuments(data.obsoleteDocuments || [])
      }
    } catch (error) {
      console.error("❌ Erreur récupération documents requis:", error)
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      lease: "Bail",
      receipt: "Quittance",
      incident: "Incident",
      maintenance: "Travaux",
      insurance: "Assurance",
      other: "Autre",
    }
    return categories[category as keyof typeof categories] || category
  }

  const getTypeLabel = (type: string) => {
    const types = {
      pdf: "PDF",
      image: "Image",
      document: "Document",
      other: "Autre",
    }
    return types[type as keyof typeof types] || type
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const filteredDocuments = documents.filter((document) => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || document.category === categoryFilter
    const matchesType = typeFilter === "all" || document.type === typeFilter

    return matchesSearch && matchesCategory && matchesType
  })

  const getStatusIcon = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <Badge variant="destructive">Urgent</Badge>
      case "medium":
        return <Badge className="bg-yellow-600">Bientôt expiré</Badge>
      case "low":
        return <Badge className="bg-green-600">À jour</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de vos documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes documents</h2>
          <p className="text-muted-foreground">
            Consultez et téléchargez vos documents ({filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''})
          </p>
        </div>
        <Button asChild>
          <Link href="/tenant/rental-management/documents/upload">
            <Upload className="h-4 w-4 mr-2" />
            Transmettre un document
          </Link>
        </Button>
      </div>

      {/* Documents requis */}
      {requiredDocuments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Documents à mettre à jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.urgency)}
                    <div>
                      <h4 className="font-medium">{doc.documentName}</h4>
                      <p className="text-sm text-gray-600">{doc.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.urgency)}
                    <Button 
                      size="sm" 
                      asChild
                    >
                      <Link href={`/tenant/rental-management/documents/upload?type=${doc.documentType}`}>
                        <Upload className="h-4 w-4 mr-2" />
                        Mettre à jour
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="lease">Bail</SelectItem>
                <SelectItem value="receipt">Quittance</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="maintenance">Travaux</SelectItem>
                <SelectItem value="insurance">Assurance</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0 
                ? "Aucun document disponible pour le moment."
                : "Aucun document ne correspond à vos critères de recherche."
              }
            </p>
            {documents.length === 0 && (
              <Button asChild>
                <Link href="/tenant/rental-management/documents/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Transmettre un document
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{document.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">{getCategoryLabel(document.category)}</Badge>
                        <Badge variant="outline">{getTypeLabel(document.type)}</Badge>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(document.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                        {document.file_size && (
                          <span>{formatFileSize(document.file_size)}</span>
                        )}
                        <span>Par {document.uploaded_by.first_name} {document.uploaded_by.last_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={document.file_url} target="_blank">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={document.file_url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
