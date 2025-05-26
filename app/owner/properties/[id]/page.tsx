"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Home,
  Phone,
  Mail,
  Briefcase,
  CheckCircle,
  X,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VisitSlotSelector } from "@/components/visit-slot-selector"

// Données simulées pour une candidature
const application = {
  id: 1,
  status: "En cours d'analyse",
  appliedDate: "2023-05-20",
  lastUpdate: "2023-05-21",
  matchScore: 85,
  property: {
    id: 1,
    title: "Appartement moderne au centre-ville",
    address: "123 Rue Principale, Paris",
    price: 1200,
    charges: 150,
    deposit: 2400,
    surface: 65,
    rooms: 3,
    bedrooms: 2,
    image: "/placeholder.svg?height=200&width=300",
  },
  tenant: {
    id: 101,
    name: "Jean Dupont",
    age: 32,
    email: "jean.dupont@example.com",
    phone: "06 12 34 56 78",
    profession: "Ingénieur logiciel",
    company: "Tech Solutions",
    contractType: "CDI",
    income: 3800,
    additionalIncome: 0,
    totalIncome: 3800,
    hasGuarantor: true,
    guarantor: {
      name: "Marie Dupont",
      relationship: "Parent",
      profession: "Enseignante",
      income: 3200,
    },
    currentAddress: "45 Avenue des Lilas, 75011 Paris",
    moveInDate: "2023-06-15",
    duration: "Long terme (3+ ans)",
    presentation:
      "Bonjour, je suis ingénieur logiciel en CDI depuis 5 ans. Je recherche un appartement spacieux et lumineux pour m'installer durablement. Je suis non-fumeur, sans animaux, et j'apprécie le calme. Mes revenus sont stables et je peux fournir toutes les garanties nécessaires.",
    documents: [
      { type: "Pièce d'identité", status: "Vérifié", date: "2023-05-20" },
      { type: "Justificatifs de revenus (3 derniers mois)", status: "Vérifié", date: "2023-05-20" },
      { type: "Attestation employeur", status: "Vérifié", date: "2023-05-20" },
      { type: "Avis d'imposition", status: "Vérifié", date: "2023-05-20" },
      { type: "Quittances de loyer", status: "Vérifié", date: "2023-05-20" },
      { type: "Garantie Visale", status: "Non fourni", date: null },
    ],
  },
  notes: "",
}

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("profile")
  const [notes, setNotes] = useState(application.notes)
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [visitDate, setVisitDate] = useState("")
  const [visitTime, setVisitTime] = useState("")
  const [visitNotes, setVisitNotes] = useState("")
  const [refusalDialogOpen, setRefusalDialogOpen] = useState(false)
  const [refusalReason, setRefusalReason] = useState("")
  const [refusalMessage, setRefusalMessage] = useState("")
  const [showVisitSelector, setShowVisitSelector] = useState(false)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "En cours d'analyse":
        return "secondary"
      case "Visite programmée":
        return "default"
      case "Dossier accepté":
        return "success"
      case "Refusé":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getDocumentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Vérifié":
        return "success"
      case "En attente":
        return "secondary"
      case "Non fourni":
        return "outline"
      case "Rejeté":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleSaveNotes = () => {
    // Logique pour sauvegarder les notes
    alert("Notes sauvegardées")
  }

  const handleScheduleVisit = () => {
    setShowVisitSelector(true)
  }

  const handleSlotsSelected = async (selectedSlots) => {
    try {
      // Ici on pourrait envoyer les créneaux proposés au candidat
      // Pour l'instant, on met juste à jour le statut
      // await propertyService.updateApplicationStatus(application.id, "visit_scheduled")
      setShowVisitSelector(false)
      alert(`${selectedSlots.length} créneau(x) proposé(s) au candidat`)
      // Recharger la page ou mettre à jour les données
      // window.location.reload()
    } catch (error) {
      alert("Erreur lors de la proposition de visite")
    }
  }

  const handleCancelVisitSelection = () => {
    setShowVisitSelector(false)
  }

  const handleRefuseApplication = () => {
    // Logique pour refuser la candidature
    setRefusalDialogOpen(false)
    alert("Candidature refusée")
  }

  const handleAcceptApplication = () => {
    // Logique pour accepter la candidature
    alert("Candidature acceptée")
  }

  return (
    <div className="container mx-auto py-6">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/owner/dashboard?tab=applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux candidatures
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Candidature de {application.tenant.name}</h1>
          <p className="text-muted-foreground">
            Pour {application.property.title} • Reçue le {new Date(application.appliedDate).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(application.status)} className="text-sm">
          {application.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Score de compatibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold">{application.matchScore}%</span>
                <Badge
                  variant={
                    application.matchScore >= 80 ? "success" : application.matchScore >= 60 ? "secondary" : "outline"
                  }
                >
                  {application.matchScore >= 80 ? "Excellent" : application.matchScore >= 60 ? "Bon" : "Moyen"}
                </Badge>
              </div>
              <Progress value={application.matchScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Score basé sur les revenus, la stabilité professionnelle et les critères de recherche
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Informations sur le bien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-md">
                <img
                  src={application.property.image || "/placeholder.svg"}
                  alt={application.property.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">{application.property.title}</h3>
                <p className="text-sm text-muted-foreground">{application.property.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Loyer</p>
                  <p className="font-medium">{application.property.price} €/mois</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Charges</p>
                  <p className="font-medium">{application.property.charges} €/mois</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dépôt</p>
                  <p className="font-medium">{application.property.deposit} €</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Surface</p>
                  <p className="font-medium">{application.property.surface} m²</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/properties/${application.property.id}`}>Voir l'annonce</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.status === "En cours d'analyse" && (
                <>
                  {showVisitSelector ? (
                    <VisitSlotSelector
                      propertyId={application.property.id}
                      applicationId={application.id}
                      onSlotsSelected={handleSlotsSelected}
                      onCancel={handleCancelVisitSelection}
                    />
                  ) : (
                    // Le contenu normal de la page
                    <div>
                      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full">Proposer une visite</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Programmer une visite</DialogTitle>
                            <DialogDescription>
                              Proposez une date et une heure pour visiter le bien avec {application.tenant.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="visit-date">Date</Label>
                                <Input
                                  id="visit-date"
                                  type="date"
                                  value={visitDate}
                                  onChange={(e) => setVisitDate(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="visit-time">Heure</Label>
                                <Input
                                  id="visit-time"
                                  type="time"
                                  value={visitTime}
                                  onChange={(e) => setVisitTime(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="visit-notes">Instructions (optionnel)</Label>
                              <Textarea
                                id="visit-notes"
                                placeholder="Informations complémentaires pour la visite..."
                                value={visitNotes}
                                onChange={(e) => setVisitNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handleScheduleVisit} disabled={!visitDate || !visitTime}>
                              Programmer la visite
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  <Dialog open={refusalDialogOpen} onOpenChange={setRefusalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Refuser la candidature
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Refuser la candidature</DialogTitle>
                        <DialogDescription>
                          Veuillez indiquer la raison du refus. Un message sera envoyé au candidat.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="refusal-reason">Motif du refus</Label>
                          <Select value={refusalReason} onValueChange={setRefusalReason}>
                            <SelectTrigger id="refusal-reason">
                              <SelectValue placeholder="Sélectionnez un motif" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Revenus insuffisants</SelectItem>
                              <SelectItem value="documents">Documents incomplets</SelectItem>
                              <SelectItem value="profile">Profil ne correspondant pas aux critères</SelectItem>
                              <SelectItem value="other">Autre candidature retenue</SelectItem>
                              <SelectItem value="custom">Autre raison</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="refusal-message">Message (optionnel)</Label>
                          <Textarea
                            id="refusal-message"
                            placeholder="Message personnalisé pour le candidat..."
                            value={refusalMessage}
                            onChange={(e) => setRefusalMessage(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRefusalDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleRefuseApplication} disabled={!refusalReason}>
                          Confirmer le refus
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {application.status === "Visite programmée" && (
                <>
                  <Button className="w-full" onClick={handleAcceptApplication}>
                    Accepter le dossier
                  </Button>
                  <Dialog open={refusalDialogOpen} onOpenChange={setRefusalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Refuser la candidature
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Refuser la candidature</DialogTitle>
                        <DialogDescription>
                          Veuillez indiquer la raison du refus. Un message sera envoyé au candidat.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="refusal-reason">Motif du refus</Label>
                          <Select value={refusalReason} onValueChange={setRefusalReason}>
                            <SelectTrigger id="refusal-reason">
                              <SelectValue placeholder="Sélectionnez un motif" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Revenus insuffisants</SelectItem>
                              <SelectItem value="documents">Documents incomplets</SelectItem>
                              <SelectItem value="profile">Profil ne correspondant pas aux critères</SelectItem>
                              <SelectItem value="other">Autre candidature retenue</SelectItem>
                              <SelectItem value="visit">Suite à la visite</SelectItem>
                              <SelectItem value="custom">Autre raison</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="refusal-message">Message (optionnel)</Label>
                          <Textarea
                            id="refusal-message"
                            placeholder="Message personnalisé pour le candidat..."
                            value={refusalMessage}
                            onChange={(e) => setRefusalMessage(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRefusalDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleRefuseApplication} disabled={!refusalReason}>
                          Confirmer le refus
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {application.status === "Dossier accepté" && (
                <Button className="w-full" asChild>
                  <Link href={`/owner/leases/new?application=${application.id}`}>Créer le bail</Link>
                </Button>
              )}

              <Button variant="outline" className="w-full">
                Contacter le candidat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ajouter des notes sur ce candidat..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button size="sm" onClick={handleSaveNotes}>
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>
                    {application.tenant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{application.tenant.name}</CardTitle>
                  <CardDescription>{application.tenant.age} ans</CardDescription>
                </div>
              </div>
            </CardHeader>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6">
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1">
                    Profil
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="flex-1">
                    Situation financière
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex-1">
                    Documents
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile" className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Coordonnées</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{application.tenant.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{application.tenant.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{application.tenant.currentAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Situation professionnelle</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{application.tenant.profession}</span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{application.tenant.company}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{application.tenant.contractType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Projet de location</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            Emménagement souhaité: {new Date(application.tenant.moveInDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Durée souhaitée: {application.tenant.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Présentation</h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">{application.tenant.presentation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Revenus</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Revenus mensuels</span>
                          <span className="font-medium">{application.tenant.income} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revenus complémentaires</span>
                          <span className="font-medium">{application.tenant.additionalIncome} €</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-medium">Total des revenus</span>
                          <span className="font-medium">{application.tenant.totalIncome} €</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Taux d'effort</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Loyer charges comprises</span>
                          <span className="font-medium">
                            {application.property.price + application.property.charges} €
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taux d'effort</span>
                          <span className="font-medium">
                            {Math.round(
                              ((application.property.price + application.property.charges) /
                                application.tenant.totalIncome) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Recommandé: maximum 33%</span>
                            <span className="text-xs font-medium">
                              {Math.round(
                                ((application.property.price + application.property.charges) /
                                  application.tenant.totalIncome) *
                                  100,
                              ) <= 33 ? (
                                <span className="text-green-600">Bon</span>
                              ) : (
                                <span className="text-amber-600">Élevé</span>
                              )}
                            </span>
                          </div>
                          <Progress
                            value={Math.round(
                              ((application.property.price + application.property.charges) /
                                application.tenant.totalIncome) *
                                100,
                            )}
                            max={50}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {application.tenant.hasGuarantor && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Garant</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Nom</span>
                            <span className="font-medium">{application.tenant.guarantor.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lien</span>
                            <span className="font-medium">{application.tenant.guarantor.relationship}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Profession</span>
                            <span className="font-medium">{application.tenant.guarantor.profession}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenus mensuels</span>
                            <span className="font-medium">{application.tenant.guarantor.income} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ratio revenus/loyer</span>
                            <span className="font-medium">
                              {Math.round(
                                application.tenant.guarantor.income /
                                  (application.property.price + application.property.charges),
                              )}
                              x
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Capacité financière</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          {application.tenant.totalIncome >=
                          (application.property.price + application.property.charges) * 3 ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 mr-2" />
                          )}
                          <span>
                            Revenus ≥ 3x le loyer
                            {application.tenant.totalIncome >=
                            (application.property.price + application.property.charges) * 3
                              ? ""
                              : ` (${Math.round((application.tenant.totalIncome / (application.property.price + application.property.charges)) * 10) / 10}x)`}
                          </span>
                        </div>

                        <div className="flex items-center">
                          {application.tenant.hasGuarantor ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 mr-2" />
                          )}
                          <span>Présence d'un garant</span>
                        </div>

                        {application.tenant.hasGuarantor && (
                          <div className="flex items-center">
                            {application.tenant.guarantor.income >=
                            (application.property.price + application.property.charges) * 3 ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mr-2" />
                            )}
                            <span>
                              Revenus du garant ≥ 3x le loyer
                              {application.tenant.guarantor.income >=
                              (application.property.price + application.property.charges) * 3
                                ? ""
                                : ` (${Math.round((application.tenant.guarantor.income / (application.property.price + application.property.charges)) * 10) / 10}x)`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center">
                          {application.tenant.contractType === "CDI" ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 mr-2" />
                          )}
                          <span>Contrat stable (CDI)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Documents fournis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {application.tenant.documents.map((doc, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-600" />
                          <span>{doc.type}</span>
                        </div>
                        <div className="flex items-center">
                          <Badge variant={getDocumentStatusBadgeVariant(doc.status)} className="mr-2">
                            {doc.status}
                          </Badge>
                          {doc.status === "Vérifié" && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800">Vérification des documents</h3>
                      <p className="text-sm text-blue-700">
                        Tous les documents ont été vérifiés automatiquement par notre système. Les pièces d'identité ont
                        été contrôlées et les justificatifs de revenus ont été authentifiés.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
