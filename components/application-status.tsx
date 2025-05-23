"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircleIcon, ClockIcon, XCircleIcon, EyeIcon, MessageSquareIcon, FileTextIcon } from "lucide-react"

export function ApplicationStatus() {
  // Mock data - in real app, this would come from API
  const applications = [
    {
      id: 1,
      propertyTitle: "Appartement 3P - Belleville",
      propertyAddress: "15 rue de Belleville, 75020 Paris",
      landlordName: "M. Martin",
      submittedAt: "2025-05-20T10:30:00",
      status: "pending",
      statusMessage: "Votre dossier est en cours d'examen par le propriétaire",
      progress: 50,
      steps: [
        { name: "Dossier soumis", completed: true, date: "2025-05-20" },
        { name: "En cours d'examen", completed: false, current: true },
        { name: "Décision du propriétaire", completed: false },
        { name: "Signature du bail", completed: false },
      ],
      actions: ["view", "message"],
    },
    {
      id: 2,
      propertyTitle: "Studio meublé - République",
      propertyAddress: "8 rue du Temple, 75003 Paris",
      landlordName: "Mme Dubois",
      submittedAt: "2025-05-18T14:15:00",
      status: "accepted",
      statusMessage: "Félicitations ! Votre dossier a été accepté",
      progress: 75,
      steps: [
        { name: "Dossier soumis", completed: true, date: "2025-05-18" },
        { name: "Examen terminé", completed: true, date: "2025-05-19" },
        { name: "Dossier accepté", completed: true, date: "2025-05-20", current: true },
        { name: "Signature du bail", completed: false },
      ],
      actions: ["view", "message", "sign"],
    },
    {
      id: 3,
      propertyTitle: "Maison 4P - Montreuil",
      propertyAddress: "25 avenue de la République, 93100 Montreuil",
      landlordName: "M. Leroy",
      submittedAt: "2025-05-15T09:00:00",
      status: "rejected",
      statusMessage: "Votre dossier n'a pas été retenu pour ce bien",
      progress: 100,
      steps: [
        { name: "Dossier soumis", completed: true, date: "2025-05-15" },
        { name: "Examen terminé", completed: true, date: "2025-05-17" },
        { name: "Dossier non retenu", completed: true, date: "2025-05-17", current: true },
      ],
      actions: ["view"],
    },
  ]

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-orange-600"
      case "accepted":
        return "text-green-600"
      case "rejected":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune candidature</h3>
            <p className="text-muted-foreground mb-4">Vous n'avez pas encore soumis de candidature pour un bien.</p>
            <Button>Rechercher des biens</Button>
          </CardContent>
        </Card>
      ) : (
        applications.map((application) => (
          <Card key={application.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{application.propertyTitle}</CardTitle>
                  <CardDescription>{application.propertyAddress}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">Propriétaire: {application.landlordName}</p>
                </div>
                {getStatusBadge(application.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status message */}
              <div
                className={`p-4 rounded-lg border-l-4 ${
                  application.status === "pending"
                    ? "bg-orange-50 border-orange-400"
                    : application.status === "accepted"
                      ? "bg-green-50 border-green-400"
                      : "bg-red-50 border-red-400"
                }`}
              >
                <p className={`font-medium ${getStatusColor(application.status)}`}>{application.statusMessage}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Candidature soumise le{" "}
                  {new Date(application.submittedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Progression du dossier</h4>
                  <span className="text-sm text-muted-foreground">{application.progress}%</span>
                </div>
                <Progress value={application.progress} className="w-full" />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <h4 className="font-medium">Étapes du processus</h4>
                <div className="space-y-2">
                  {application.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          step.completed
                            ? "bg-green-500 text-white"
                            : step.current
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            step.current ? "text-blue-600" : step.completed ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {step.name}
                        </p>
                        {step.date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(step.date).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {application.actions.includes("view") && (
                  <Button variant="outline" size="sm">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Voir le bien
                  </Button>
                )}
                {application.actions.includes("message") && (
                  <Button variant="outline" size="sm">
                    <MessageSquareIcon className="h-4 w-4 mr-1" />
                    Contacter
                  </Button>
                )}
                {application.actions.includes("sign") && (
                  <Button size="sm">
                    <FileTextIcon className="h-4 w-4 mr-1" />
                    Signer le bail
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
