"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  Download,
  Upload,
  Eye,
  Trash2,
  MoreHorizontal,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react"

// Données simulées pour les documents
const documents = [
  {
    id: 1,
    name: "Bail - Appartement moderne",
    type: "lease",
    property: "Appartement moderne au centre-ville",
    tenant: "Jean Dupont",
    size: "2.4 MB",
    uploadDate: "2024-01-15",
    expiryDate: "2027-01-15",
    status: "active",
    category: "Contrats",
  },
  {
    id: 2,
    name: "DPE - Studio étudiant",
    type: "dpe",
    property: "Studio étudiant rénové",
    size: "1.2 MB",
    uploadDate: "2024-01-10",
    expiryDate: "2034-01-10",
    status: "valid",
    category: "Diagnostics",
  },
  {
    id: 3,
    name: "État des lieux - Loft industriel",
    type: "inventory",
    property: "Loft industriel spacieux",
    tenant: "Marie Leroy",
    size: "5.8 MB",
    uploadDate: "2024-01-08",
    status: "signed",
    category: "États des lieux",
  },
  {
    id: 4,
    name: "Assurance PNO - Maison familiale",
    type: "insurance",
    property: "Maison familiale avec jardin",
    size: "890 KB",
    uploadDate: "2023-12-01",
    expiryDate: "2024-12-01",
    status: "expiring",
    category: "Assurances",
  },
  {
    id: 5,
    name: "Quittance Décembre 2023",
    type: "receipt",
    property: "Appartement moderne au centre-ville",
    tenant: "Jean Dupont",
    size: "156 KB",
    uploadDate: "2024-01-05",
    status: "sent",
    category: "Quittances",
  },
]

const documentTypes = {
  lease: { label: "Bail", icon: FileText, color: "blue" },
  dpe: { label: "DPE", icon: FileText, color: "green" },
  inventory: { label: "État des lieux", icon: FileText, color: "purple" },
  insurance: { label: "Assurance", icon: FileText, color: "orange" },
  receipt: { label: "Quittance", icon: FileText, color: "gray" },
}

const statusConfig = {
  active: { label: "Actif", color: "green", icon: CheckCircle },
  valid: { label: "Valide", color: "green", icon: CheckCircle },
  signed: { label: "Signé", color: "blue", icon: CheckCircle },
  expiring: { label: "Expire bientôt", color: "orange", icon: AlertCircle },
  sent: { label: "Envoyé", color: "blue", icon: Clock },
}

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.tenant && doc.tenant.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = ["all", ...new Set(documents.map((doc) => doc.category))]
  const statuses = ["all", ...new Set(documents.map((doc) => doc.status))]

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des documents</h1>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Documents total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{documents.filter((d) => d.status === "expiring").length}</p>
                <p className="text-sm text-muted-foreground">Expirent bientôt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {documents.filter((d) => d.status === "active" || d.status === "valid").length}
                </p>
                <p className="text-sm text-muted-foreground">Valides</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{documents.filter((d) => d.status === "sent").length}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories
                  .filter((cat) => cat !== "all")
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statuses
                  .filter((status) => status !== "all")
                  .map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status as keyof typeof statusConfig]?.label || status}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="grid">Grille</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
              <CardDescription>Gérez tous vos documents immobiliers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.map((document) => {
                  const docType = documentTypes[document.type as keyof typeof documentTypes]
                  const status = statusConfig[document.status as keyof typeof statusConfig]
                  const Icon = docType?.icon || FileText
                  const StatusIcon = status?.icon || Clock

                  return (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg bg-${docType?.color || "gray"}-100`}>
                          <Icon className={`h-5 w-5 text-${docType?.color || "gray"}-600`} />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-medium">{document.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{document.property}</span>
                            {document.tenant && (
                              <>
                                <span>•</span>
                                <span>{document.tenant}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{document.size}</span>
                            <span>•</span>
                            <span>{new Date(document.uploadDate).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge
                          variant={
                            status?.color === "green" ? "default" : status?.color === "orange" ? "secondary" : "outline"
                          }
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status?.label}
                        </Badge>

                        {document.expiryDate && (
                          <div className="text-sm text-muted-foreground">
                            Expire le {new Date(document.expiryDate).toLocaleDateString("fr-FR")}
                          </div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Aperçu
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((document) => {
              const docType = documentTypes[document.type as keyof typeof documentTypes]
              const status = statusConfig[document.status as keyof typeof statusConfig]
              const Icon = docType?.icon || FileText
              const StatusIcon = status?.icon || Clock

              return (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg bg-${docType?.color || "gray"}-100`}>
                        <Icon className={`h-6 w-6 text-${docType?.color || "gray"}-600`} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg">{document.name}</CardTitle>
                    <CardDescription>{document.property}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {document.tenant && <p className="text-sm text-muted-foreground">Locataire: {document.tenant}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{document.size}</span>
                        <Badge
                          variant={
                            status?.color === "green" ? "default" : status?.color === "orange" ? "secondary" : "outline"
                          }
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {new Date(document.uploadDate).toLocaleDateString("fr-FR")}
                      </p>
                      {document.expiryDate && (
                        <p className="text-xs text-muted-foreground">
                          Expire le {new Date(document.expiryDate).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
