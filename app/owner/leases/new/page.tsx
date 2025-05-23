"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Calendar, Check, FileText, Home, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Données simulées
const application = {
  id: 1,
  tenant: {
    id: 101,
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    phone: "06 12 34 56 78",
    address: "45 Avenue des Lilas, 75011 Paris",
    birthDate: "1991-05-15",
    birthPlace: "Paris",
  },
  property: {
    id: 1,
    title: "Appartement moderne au centre-ville",
    address: "123 Rue Principale, 75001 Paris",
    type: "Appartement",
    surface: 65,
    rooms: 3,
    bedrooms: 2,
    price: 1200,
    charges: 150,
    deposit: 2400,
  },
}

export default function NewLeasePage() {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [leaseType, setLeaseType] = useState("habitation")
  const [leaseDuration, setLeaseDuration] = useState("3")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [rentPaymentDay, setRentPaymentDay] = useState("5")
  const [includeInventory, setIncludeInventory] = useState(true)
  const [inventoryDate, setInventoryDate] = useState("")
  const [additionalClauses, setAdditionalClauses] = useState("")

  const nextStep = () => setStep(Math.min(step + 1, totalSteps))
  const prevStep = () => setStep(Math.max(step - 1, 1))

  const calculateEndDate = (start: string, duration: string) => {
    if (!start) return ""
    const startDate = new Date(start)
    const years = Number.parseInt(duration)
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    return endDate.toISOString().split("T")[0]
  }

  const handleStartDateChange = (date: string) => {
    setStartDate(date)
    setEndDate(calculateEndDate(date, leaseDuration))
  }

  const handleDurationChange = (duration: string) => {
    setLeaseDuration(duration)
    setEndDate(calculateEndDate(startDate, duration))
  }

  const handleGenerateLease = () => {
    // Logique pour générer le bail
    alert("Bail généré avec succès")
  }

  return (
    <div className="container mx-auto py-6">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/owner/dashboard?tab=applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Création d'un nouveau bail</h1>
        <p className="text-muted-foreground">Suivez les étapes pour créer un bail de location</p>
      </div>

      <div className="mb-8">
        <Progress value={(step / totalSteps) * 100} className="mb-4" />
        <div className="flex justify-between text-sm">
          <span className={step >= 1 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Home className="h-4 w-4 inline mr-1" />
            Bien et locataire
          </span>
          <span className={step >= 2 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <FileText className="h-4 w-4 inline mr-1" />
            Type de bail
          </span>
          <span className={step >= 3 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Calendar className="h-4 w-4 inline mr-1" />
            Dates et loyer
          </span>
          <span className={step >= 4 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Upload className="h-4 w-4 inline mr-1" />
            Documents
          </span>
          <span className={step >= 5 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Check className="h-4 w-4 inline mr-1" />
            Finalisation
          </span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Bien et locataire</CardTitle>
            <CardDescription>Vérifiez les informations du bien et du locataire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bien immobilier</h3>
                <div className="space-y-4">
                  <div className="aspect-video w-full overflow-hidden rounded-md">
                    <img
                      src="/placeholder.svg?height=200&width=300"
                      alt={application.property.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{application.property.title}</h4>
                    <p className="text-sm text-muted-foreground">{application.property.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{application.property.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Surface</p>
                      <p className="font-medium">{application.property.surface} m²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pièces</p>
                      <p className="font-medium">{application.property.rooms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Chambres</p>
                      <p className="font-medium">{application.property.bedrooms}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Loyer</p>
                      <p className="font-medium">{application.property.price} €/mois</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Charges</p>
                      <p className="font-medium">{application.property.charges} €/mois</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dépôt de garantie</p>
                      <p className="font-medium">{application.property.deposit} €</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Locataire</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarFallback>
                        {application.tenant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{application.tenant.name}</h4>
                      <p className="text-sm text-muted-foreground">Locataire principal</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="tenant-email">Email</Label>
                        <Input id="tenant-email" value={application.tenant.email} readOnly />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tenant-phone">Téléphone</Label>
                        <Input id="tenant-phone" value={application.tenant.phone} readOnly />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tenant-address">Adresse actuelle</Label>
                        <Input id="tenant-address" value={application.tenant.address} readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="tenant-birthdate">Date de naissance</Label>
                        <Input
                          id="tenant-birthdate"
                          value={new Date(application.tenant.birthDate).toLocaleDateString("fr-FR")}
                          readOnly
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tenant-birthplace">Lieu de naissance</Label>
                        <Input id="tenant-birthplace" value={application.tenant.birthPlace} readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ajouter des colocataires ?</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="add-roommates" />
                      <label
                        htmlFor="add-roommates"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Oui, ajouter des colocataires
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={nextStep}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Type de bail</CardTitle>
            <CardDescription>Sélectionnez le type de bail et sa durée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lease-type">Type de bail</Label>
                <Select value={leaseType} onValueChange={setLeaseType}>
                  <SelectTrigger id="lease-type">
                    <SelectValue placeholder="Sélectionnez un type de bail" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habitation">Bail d'habitation vide</SelectItem>
                    <SelectItem value="meuble">Bail d'habitation meublé</SelectItem>
                    <SelectItem value="mobilite">Bail mobilité</SelectItem>
                    <SelectItem value="etudiant">Bail étudiant</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {leaseType === "habitation"
                    ? "Bail standard pour une résidence principale non meublée."
                    : leaseType === "meuble"
                      ? "Bail pour une résidence principale meublée."
                      : leaseType === "mobilite"
                        ? "Bail de courte durée (1 à 10 mois) pour personnes en formation, études, stage, etc."
                        : "Bail spécifique pour les étudiants, durée de 9 mois minimum."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lease-duration">Durée du bail</Label>
                <Select value={leaseDuration} onValueChange={handleDurationChange}>
                  <SelectTrigger id="lease-duration">
                    <SelectValue placeholder="Sélectionnez une durée" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaseType === "habitation" ? (
                      <>
                        <SelectItem value="3">3 ans (recommandé)</SelectItem>
                        <SelectItem value="6">6 ans</SelectItem>
                      </>
                    ) : leaseType === "meuble" ? (
                      <>
                        <SelectItem value="1">1 an (recommandé)</SelectItem>
                        <SelectItem value="2">2 ans</SelectItem>
                        <SelectItem value="3">3 ans</SelectItem>
                      </>
                    ) : leaseType === "mobilite" ? (
                      <>
                        <SelectItem value="0.25">3 mois</SelectItem>
                        <SelectItem value="0.5">6 mois</SelectItem>
                        <SelectItem value="0.75">9 mois</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="0.75">9 mois (année scolaire)</SelectItem>
                        <SelectItem value="1">1 an</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {leaseType === "habitation"
                    ? "La durée minimale légale est de 3 ans pour un bailleur particulier."
                    : leaseType === "meuble"
                      ? "La durée minimale légale est de 1 an (9 mois pour un étudiant)."
                      : leaseType === "mobilite"
                        ? "La durée maximale est de 10 mois, non renouvelable."
                        : "La durée minimale est de 9 mois, correspondant à l'année universitaire."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Clauses particulières</Label>
                <Tabs defaultValue="standard">
                  <TabsList className="w-full">
                    <TabsTrigger value="standard" className="flex-1">
                      Clauses standards
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex-1">
                      Clauses personnalisées
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="standard" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="clause-animals" defaultChecked />
                        <label
                          htmlFor="clause-animals"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Interdiction des animaux domestiques
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="clause-smoking" defaultChecked />
                        <label
                          htmlFor="clause-smoking"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Interdiction de fumer dans le logement
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="clause-insurance" defaultChecked />
                        <label
                          htmlFor="clause-insurance"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Obligation d'assurance habitation
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="clause-maintenance" defaultChecked />
                        <label
                          htmlFor="clause-maintenance"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Entretien courant à la charge du locataire
                        </label>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="custom" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="additional-clauses">Clauses supplémentaires</Label>
                      <Textarea
                        id="additional-clauses"
                        placeholder="Ajoutez ici vos clauses personnalisées..."
                        value={additionalClauses}
                        onChange={(e) => setAdditionalClauses(e.target.value)}
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Attention : les clauses abusives ou contraires à la loi seront automatiquement invalidées.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button onClick={nextStep}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Dates et loyer</CardTitle>
            <CardDescription>Définissez les dates du bail et les modalités de paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dates du bail</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Date de début</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Date de fin</Label>
                    <Input id="end-date" type="date" value={endDate} readOnly />
                    <p className="text-xs text-muted-foreground">Calculée automatiquement selon la durée du bail</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-inventory" checked={includeInventory} onCheckedChange={setIncludeInventory} />
                    <label
                      htmlFor="include-inventory"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      État des lieux d'entrée
                    </label>
                  </div>
                  {includeInventory && (
                    <div className="mt-2">
                      <Label htmlFor="inventory-date">Date de l'état des lieux</Label>
                      <Input
                        id="inventory-date"
                        type="date"
                        value={inventoryDate}
                        onChange={(e) => setInventoryDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Loyer et paiement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rent-amount">Loyer mensuel</Label>
                    <Input id="rent-amount" value={`${application.property.price} €`} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="charges-amount">Charges mensuelles</Label>
                    <Input id="charges-amount" value={`${application.property.charges} €`} readOnly />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total-amount">Total mensuel</Label>
                    <Input
                      id="total-amount"
                      value={`${application.property.price + application.property.charges} €`}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Dépôt de garantie</Label>
                    <Input id="deposit-amount" value={`${application.property.deposit} €`} readOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-day">Jour de paiement du loyer</Label>
                  <Select value={rentPaymentDay} onValueChange={setRentPaymentDay}>
                    <SelectTrigger id="payment-day">
                      <SelectValue placeholder="Sélectionnez un jour" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1er du mois</SelectItem>
                      <SelectItem value="5">5 du mois</SelectItem>
                      <SelectItem value="10">10 du mois</SelectItem>
                      <SelectItem value="15">15 du mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Méthode de paiement</Label>
                  <Select defaultValue="virement">
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Sélectionnez une méthode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virement">Virement bancaire</SelectItem>
                      <SelectItem value="prelevement">Prélèvement automatique</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button onClick={nextStep}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents annexes</CardTitle>
            <CardDescription>Ajoutez les documents obligatoires et annexes au bail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents obligatoires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h4 className="font-medium mb-1">Diagnostic de Performance Énergétique (DPE)</h4>
                  <p className="text-sm text-muted-foreground mb-3">Obligatoire</p>
                  <Button variant="outline" size="sm">
                    Téléverser
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h4 className="font-medium mb-1">État des Risques et Pollutions (ERP)</h4>
                  <p className="text-sm text-muted-foreground mb-3">Obligatoire</p>
                  <Button variant="outline" size="sm">
                    Téléverser
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h4 className="font-medium mb-1">Constat de risque d'exposition au plomb (CREP)</h4>
                  <p className="text-sm text-muted-foreground mb-3">Si logement construit avant 1949</p>
                  <Button variant="outline" size="sm">
                    Téléverser
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h4 className="font-medium mb-1">Diagnostic amiante</h4>
                  <p className="text-sm text-muted-foreground mb-3">Si logement construit avant 1997</p>
                  <Button variant="outline" size="sm">
                    Téléverser
                  </Button>
                </div>
              </div>
            </div>

            {leaseType === "meuble" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Inventaire du mobilier</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h4 className="font-medium mb-1">Inventaire détaillé du mobilier</h4>
                  <p className="text-sm text-muted-foreground mb-3">Obligatoire pour un bail meublé</p>
                  <Button variant="outline" size="sm">
                    Téléverser
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents annexes</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <h4 className="font-medium mb-1">Règlement de copropriété</h4>
                <p className="text-sm text-muted-foreground mb-3">Si applicable</p>
                <Button variant="outline" size="sm">
                  Téléverser
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Vérification automatique</h3>
                  <p className="text-sm text-blue-700">
                    Notre système vérifiera automatiquement la conformité de vos documents avec la législation en
                    vigueur.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button onClick={nextStep}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Finalisation du bail</CardTitle>
            <CardDescription>Vérifiez les informations et générez le bail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Récapitulatif</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Bien</h4>
                    <p className="font-medium">{application.property.title}</p>
                    <p className="text-sm">{application.property.address}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Locataire</h4>
                    <p className="font-medium">{application.tenant.name}</p>
                    <p className="text-sm">{application.tenant.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Type de bail</h4>
                    <p className="font-medium">
                      {leaseType === "habitation"
                        ? "Bail d'habitation vide"
                        : leaseType === "meuble"
                          ? "Bail d'habitation meublé"
                          : leaseType === "mobilite"
                            ? "Bail mobilité"
                            : "Bail étudiant"}
                    </p>
                    <p className="text-sm">
                      Durée: {leaseDuration}{" "}
                      {Number.parseInt(leaseDuration) < 1
                        ? "mois"
                        : Number.parseInt(leaseDuration) === 1
                          ? "an"
                          : "ans"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Dates</h4>
                    <p className="font-medium">
                      Du {startDate ? new Date(startDate).toLocaleDateString("fr-FR") : "___"} au{" "}
                      {endDate ? new Date(endDate).toLocaleDateString("fr-FR") : "___"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Loyer et charges</h4>
                    <p className="font-medium">
                      {application.property.price} € + {application.property.charges} € ={" "}
                      {application.property.price + application.property.charges} €/mois
                    </p>
                    <p className="text-sm">Paiement le {rentPaymentDay} du mois</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Dépôt de garantie</h4>
                    <p className="font-medium">{application.property.deposit} €</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents manquants</h3>
              {startDate ? (
                <div className="flex items-center">
                  <Badge variant="success" className="mr-2">
                    Complet
                  </Badge>
                  <span>Tous les documents obligatoires ont été fournis</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Badge variant="destructive" className="mr-2">
                    Incomplet
                  </Badge>
                  <span>Veuillez renseigner la date de début du bail</span>
                </div>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800">Prêt à générer</h3>
                  <p className="text-sm text-green-700">
                    Une fois le bail généré, il sera envoyé au locataire pour signature électronique. Vous recevrez une
                    notification lorsque le locataire aura signé le document.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button onClick={handleGenerateLease} disabled={!startDate}>
              Générer le bail
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
