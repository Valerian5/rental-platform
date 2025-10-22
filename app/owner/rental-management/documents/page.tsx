"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, Filter, Calendar, FileText, Eye, User, Building } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Document {
  id: string
  title: string
  description?: string
  type: string
  category: string
  file_url: string
  file_size?: number
  created_at: string
  status: string
  tenant: {
    id: string
    name: string
    email: string
  }
  property: {
    id: string
    title: string
    address: string
  }
  uploaded_by: {
    id: string
    name: string
  }
}

export default function OwnerDocumentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast.error("Accès non autorisé")
          window.location.href = "/login"
          return
        }

        setCurrentUser(user)
        await loadDocuments()
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
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch("/api/documents/owner", {
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

  const getCategoryLabel = (category: string) => {
    const categories = {
      insurance: "Assurance habitation",
      boiler_service: "Entretien chaudière",
      chimney_sweep: "Ramonage",
      statement: "Document obligatoire",
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
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.property.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || document.category === categoryFilter
    const matchesType = typeFilter === "all" || document.type === typeFilter
    const matchesProperty = propertyFilter === "all" || document.property.id === propertyFilter

    return matchesSearch && matchesCategory && matchesType && matchesProperty
  })

  const uniqueProperties = Array.from(
    new Set(documents.map(doc => doc.property.id))
  ).map(id => documents.find(doc => doc.property.id === id)?.property).filter(Boolean)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Documents des locataires</h2>
        <p className="text-muted-foreground">
          Consultez les documents obligatoires transmis par vos locataires ({filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''})
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par titre, locataire ou propriété..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="insurance">Assurance habitation</SelectItem>
                <SelectItem value="boiler_service">Entretien chaudière</SelectItem>
                <SelectItem value="chimney_sweep">Ramonage</SelectItem>
                <SelectItem value="statement">Document obligatoire</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
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
          {uniqueProperties.length > 1 && (
            <div className="mt-4">
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Filtrer par propriété" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les propriétés</SelectItem>
                  {uniqueProperties.map((property) => (
                    <SelectItem key={property?.id} value={property?.id || ""}>
                      {property?.title} - {property?.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
            <p className="text-muted-foreground">
              {documents.length === 0 
                ? "Aucun document transmis par vos locataires pour le moment."
                : "Aucun document ne correspond à vos critères de recherche."
              }
            </p>
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
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{document.title}</h3>
                      {document.description && (
                        <p className="text-sm text-muted-foreground mb-2">{document.description}</p>
                      )}
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
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Par {document.uploaded_by.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span>{document.property.title}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={document.file_url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </a>
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