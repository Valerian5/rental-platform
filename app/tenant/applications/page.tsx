"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Clock, FileText, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Données simulées
const applications = [
  {
    id: 1,
    property: {
      id: 1,
      title: "Appartement moderne au centre-ville",
      address: "123 Rue Principale, Paris",
      price: 1200,
      image: "/placeholder.svg?height=200&width=300",
    },
    status: "En cours d'analyse",
    appliedDate: "2023-05-20",
    lastUpdate: "2023-05-21",
    matchScore: 85,
  },
  {
    id: 2,
    property: {
      id: 3,
      title: "Loft industriel spacieux",
      address: "12 Rue des Artistes, Paris",
      price: 1500,
      image: "/placeholder.svg?height=200&width=300",
    },
    status: "Visite proposée",
    appliedDate: "2023-05-18",
    lastUpdate: "2023-05-22",
    matchScore: 92,
    visitDate: "2023-05-25T14:00:00",
  },
  {
    id: 3,
    property: {
      id: 4,
      title: "Studio étudiant rénové",
      address: "78 Rue des Étudiants, Paris",
      price: 750,
      image: "/placeholder.svg?height=200&width=300",
    },
    status: "Refusé",
    appliedDate: "2023-05-15",
    lastUpdate: "2023-05-19",
    matchScore: 65,
    refusalReason: "Revenus insuffisants",
  },
  {
    id: 4,
    property: {
      id: 5,
      title: "Maison familiale avec jardin",
      address: "45 Avenue des Fleurs, Lyon",
      price: 1800,
      image: "/placeholder.svg?height=200&width=300",
    },
    status: "Dossier accepté",
    appliedDate: "2023-05-10",
    lastUpdate: "2023-05-17",
    matchScore: 95,
  },
]

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("date-desc")
  const [searchQuery, setSearchQuery] = useState("")

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "En cours d'analyse":
        return "secondary"
      case "Visite proposée":
        return "default"
      case "Dossier accepté":
        return "success"
      case "Refusé":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Filtrer les candidatures
  const filteredApplications = applications.filter((application) => {
    if (statusFilter !== "all" && getStatusFilterValue(application.status) !== statusFilter) {
      return false
    }
    if (searchQuery && !application.property.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // Trier les candidatures
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortOrder === "date-desc") {
      return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    } else if (sortOrder === "date-asc") {
      return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime()
    } else if (sortOrder === "match-desc") {
      return b.matchScore - a.matchScore
    }
    return 0
  })

  // Convertir le statut en valeur pour le filtre
  function getStatusFilterValue(status: string) {
    switch (status) {
      case "En cours d'analyse":
        return "pending"
      case "Visite proposée":
        return "visit"
      case "Dossier accepté":
        return "accepted"
      case "Refusé":
        return "rejected"
      default:
        return "all"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Mes candidatures</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par nom de bien..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En cours d'analyse</SelectItem>
              <SelectItem value="visit">Visite proposée</SelectItem>
              <SelectItem value="accepted">Dossier accepté</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (plus récent)</SelectItem>
              <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
              <SelectItem value="match-desc">Score de matching</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {sortedApplications.length > 0 ? (
          sortedApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 h-48 md:h-auto">
                    <img
                      src={application.property.image || "/placeholder.svg"}
                      alt={application.property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{application.property.title}</h2>
                        <p className="text-muted-foreground">{application.property.address}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
                        <div>
                          <p className="font-medium">Candidature</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(application.appliedDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 mr-2 text-blue-600" />
                        <div>
                          <p className="font-medium">Dernière mise à jour</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(application.lastUpdate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="mr-2 flex items-center">
                          <span className="font-medium mr-2">Score de matching</span>
                          <span className="text-sm font-bold">{application.matchScore}%</span>
                        </div>
                        <Progress value={application.matchScore} className="h-2 w-16 mt-2" />
                      </div>
                    </div>

                    {application.status === "Visite proposée" && application.visitDate && (
                      <div className="bg-blue-50 p-3 rounded-md mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="font-medium text-blue-800">Visite proposée</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Le propriétaire vous propose une visite le{" "}
                          {new Date(application.visitDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="default">
                            Confirmer
                          </Button>
                          <Button size="sm" variant="outline">
                            Proposer une autre date
                          </Button>
                        </div>
                      </div>
                    )}

                    {application.status === "Refusé" && application.refusalReason && (
                      <div className="bg-red-50 p-3 rounded-md mb-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-red-600 mr-2" />
                          <span className="font-medium text-red-800">Candidature refusée</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">Motif: {application.refusalReason}</p>
                      </div>
                    )}

                    {application.status === "Dossier accepté" && (
                      <div className="bg-green-50 p-3 rounded-md mb-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-green-600 mr-2" />
                          <span className="font-medium text-green-800">
                            Félicitations ! Votre dossier a été accepté
                          </span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Le propriétaire a accepté votre candidature. Vous allez bientôt recevoir le bail à signer.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${application.property.id}`}>Voir l'annonce</Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        Contacter le propriétaire
                      </Button>
                      {application.status === "En cours d'analyse" && (
                        <Button variant="destructive" size="sm">
                          Retirer ma candidature
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune candidature trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Aucune candidature ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore postulé à des annonces."}
            </p>
            <Button asChild>
              <Link href="/properties">Voir les annonces</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
