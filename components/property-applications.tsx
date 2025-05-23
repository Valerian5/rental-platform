"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileTextIcon,
  UserIcon,
  EuroIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  MessageSquareIcon,
  DownloadIcon,
} from "lucide-react"

interface PropertyApplicationsProps {
  propertyId: number
}

export function PropertyApplications({ propertyId }: PropertyApplicationsProps) {
  // Mock data - in real app, this would come from API
  const [applications] = useState([
    {
      id: 1,
      applicantName: "Marie Dupont",
      applicantEmail: "marie.dupont@email.com",
      submittedAt: "2025-05-20T10:30:00",
      status: "pending",
      monthlyIncome: 3500,
      employmentStatus: "CDI",
      hasGuarantor: true,
      guarantorName: "Jean Dupont",
      score: 85,
      documents: {
        idCard: true,
        proofOfIncome: true,
        employmentContract: true,
        bankStatements: true,
        guarantorDocuments: true,
      },
      presentation: "Jeune professionnelle sérieuse et responsable, à la recherche d'un logement stable dans Paris.",
    },
    {
      id: 2,
      applicantName: "Pierre Martin",
      applicantEmail: "pierre.martin@email.com",
      submittedAt: "2025-05-19T14:15:00",
      status: "accepted",
      monthlyIncome: 2800,
      employmentStatus: "CDI",
      hasGuarantor: false,
      score: 78,
      documents: {
        idCard: true,
        proofOfIncome: true,
        employmentContract: true,
        bankStatements: true,
        guarantorDocuments: false,
      },
      presentation: "Étudiant en master, recherche un logement proche de mon université.",
      acceptedAt: "2025-05-21T09:00:00",
    },
    {
      id: 3,
      applicantName: "Sophie Leroy",
      applicantEmail: "sophie.leroy@email.com",
      submittedAt: "2025-05-18T09:00:00",
      status: "rejected",
      monthlyIncome: 2200,
      employmentStatus: "CDD",
      hasGuarantor: true,
      guarantorName: "Michel Leroy",
      score: 62,
      documents: {
        idCard: true,
        proofOfIncome: true,
        employmentContract: false,
        bankStatements: true,
        guarantorDocuments: true,
      },
      presentation: "Famille avec deux enfants, recherche une maison avec jardin.",
      rejectionReason: "Revenus insuffisants par rapport au loyer demandé",
      rejectedAt: "2025-05-20T16:30:00",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <ClockIcon className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Accepté
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Refusé
          </Badge>
        )
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const filterByStatus = (status: string) => {
    if (status === "all") return applications
    return applications.filter((app) => app.status === status)
  }

  const handleAcceptApplication = (applicationId: number) => {
    console.log("Accepting application:", applicationId)
    // Here you would typically call an API to accept the application
  }

  const handleRejectApplication = (applicationId: number) => {
    console.log("Rejecting application:", applicationId)
    // Here you would typically call an API to reject the application
  }

  const handleDownloadDocuments = (applicationId: number) => {
    console.log("Downloading documents for application:", applicationId)
    // Here you would typically download the application documents
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{filterByStatus("pending").length}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{filterByStatus("accepted").length}</p>
              <p className="text-sm text-muted-foreground">Acceptées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{filterByStatus("rejected").length}</p>
              <p className="text-sm text-muted-foreground">Refusées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="accepted">Acceptées</TabsTrigger>
            <TabsTrigger value="rejected">Refusées</TabsTrigger>
          </TabsList>
          <Select defaultValue="score">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score (décroissant)</SelectItem>
              <SelectItem value="date">Date de soumission</SelectItem>
              <SelectItem value="income">Revenus (décroissant)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all">
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        {application.applicantName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Candidature soumise le {new Date(application.submittedAt).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(application.submittedAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(application.score)}`}>
                          {application.score}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Applicant info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <EuroIcon className="h-4 w-4" />
                        Situation financière
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenus mensuels:</span>
                          <span className="font-medium">{application.monthlyIncome}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut:</span>
                          <span className="font-medium">{application.employmentStatus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Garant
                      </h4>
                      <div className="text-sm">
                        {application.hasGuarantor ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <CheckCircleIcon className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">Garant présent</span>
                            </div>
                            <div className="text-muted-foreground">{application.guarantorName}</div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircleIcon className="h-3 w-3 text-red-500" />
                            <span className="text-red-600">Pas de garant</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4" />
                        Documents
                      </h4>
                      <div className="text-sm space-y-1">
                        {Object.entries(application.documents).map(([doc, provided]) => (
                          <div key={doc} className="flex items-center gap-1">
                            {provided ? (
                              <CheckCircleIcon className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircleIcon className="h-3 w-3 text-red-500" />
                            )}
                            <span className={provided ? "text-green-600" : "text-red-600"}>
                              {doc === "idCard" && "Pièce d'identité"}
                              {doc === "proofOfIncome" && "Justificatifs revenus"}
                              {doc === "employmentContract" && "Contrat travail"}
                              {doc === "bankStatements" && "Relevés bancaires"}
                              {doc === "guarantorDocuments" && "Documents garant"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Presentation */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Présentation</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{application.presentation}</p>
                  </div>

                  {/* Status specific information */}
                  {application.status === "accepted" && application.acceptedAt && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-1">Candidature acceptée</h4>
                      <p className="text-sm text-green-700">
                        Acceptée le {new Date(application.acceptedAt).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(application.acceptedAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}

                  {application.status === "rejected" && application.rejectionReason && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-900 mb-1">Candidature refusée</h4>
                      <p className="text-sm text-red-700 mb-2">{application.rejectionReason}</p>
                      {application.rejectedAt && (
                        <p className="text-xs text-red-600">
                          Refusée le {new Date(application.rejectedAt).toLocaleDateString("fr-FR")} à{" "}
                          {new Date(application.rejectedAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Voir le dossier complet
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadDocuments(application.id)}>
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      Télécharger documents
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquareIcon className="h-4 w-4 mr-1" />
                      Contacter
                    </Button>
                    {application.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAcceptApplication(application.id)}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Accepter
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectApplication(application.id)}>
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {filterByStatus("pending").map((application) => (
              <Card key={application.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{application.applicantName}</h3>
                      <p className="text-muted-foreground">
                        Score: {application.score} - Revenus: {application.monthlyIncome}€
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAcceptApplication(application.id)}>
                        Accepter
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectApplication(application.id)}>
                        Refuser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accepted">
          <div className="space-y-4">
            {filterByStatus("accepted").map((application) => (
              <Card key={application.id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{application.applicantName}</h3>
                  <p className="text-muted-foreground">
                    Candidature acceptée le{" "}
                    {application.acceptedAt && new Date(application.acceptedAt).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="space-y-4">
            {filterByStatus("rejected").map((application) => (
              <Card key={application.id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{application.applicantName}</h3>
                  <p className="text-muted-foreground">Candidature refusée - {application.rejectionReason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
