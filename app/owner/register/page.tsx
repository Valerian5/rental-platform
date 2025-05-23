"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, User, Home, Users, Calendar, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function OwnerRegisterPage() {
  const [step, setStep] = useState(1)
  const totalSteps = 4

  const nextStep = () => setStep(Math.min(step + 1, totalSteps))
  const prevStep = () => setStep(Math.max(step - 1, 1))

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à l'accueil
        </Link>
        <h1 className="text-3xl font-bold mb-2">Créer mon profil propriétaire</h1>
        <p className="text-muted-foreground">Mettez votre bien en location facilement</p>
      </div>

      <div className="mb-8">
        <Progress value={(step / totalSteps) * 100} className="mb-4" />
        <div className="flex justify-between text-sm">
          <span className={step >= 1 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <User className="h-4 w-4 inline mr-1" />
            Informations
          </span>
          <span className={step >= 2 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Home className="h-4 w-4 inline mr-1" />
            Votre bien
          </span>
          <span className={step >= 3 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Users className="h-4 w-4 inline mr-1" />
            Critères locataire
          </span>
          <span className={step >= 4 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Calendar className="h-4 w-4 inline mr-1" />
            Disponibilités
          </span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Commençons par vos informations de base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input id="firstName" placeholder="Votre prénom" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input id="lastName" placeholder="Votre nom" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email *</Label>
              <Input id="email" type="email" placeholder="votre.email@exemple.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input id="city" placeholder="Votre ville" />
            </div>

            <div className="flex justify-end">
              <Button onClick={nextStep}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Création de votre annonce</CardTitle>
            <CardDescription>Décrivez votre bien immobilier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input id="title" placeholder="Ex: Appartement moderne au centre-ville" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Décrivez votre bien, ses atouts, le quartier..." rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input id="address" placeholder="123 Rue de la Paix, 75001 Paris" />
              <div className="flex items-center space-x-2">
                <Checkbox id="hideAddress" />
                <Label htmlFor="hideAddress" className="text-sm">
                  Masquer l'adresse exacte dans l'annonce
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surface">Surface (m²) *</Label>
                <Input id="surface" type="number" placeholder="65" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent">Loyer hors charges (€) *</Label>
                <Input id="rent" type="number" placeholder="1200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="charges">Montant des charges (€) *</Label>
                <Input id="charges" type="number" placeholder="150" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de bien *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de location *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unfurnished">Non meublé</SelectItem>
                    <SelectItem value="furnished">Meublé</SelectItem>
                    <SelectItem value="colocation">Colocation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="constructionYear">Année de construction</Label>
                <Input id="constructionYear" type="number" placeholder="2018" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Dépôt de garantie (€) *</Label>
                <Input id="deposit" type="number" placeholder="2400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rooms">Nombre de pièces *</Label>
                <Input id="rooms" type="number" placeholder="3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Nombre de chambres *</Label>
                <Input id="bedrooms" type="number" placeholder="2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Nombre de salles de bain *</Label>
                <Input id="bathrooms" type="number" placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label>Type de chauffage</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual-electric">Individuel électrique</SelectItem>
                    <SelectItem value="individual-gas">Individuel gaz</SelectItem>
                    <SelectItem value="collective">Collectif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Extérieur</Label>
              <div className="grid grid-cols-3 gap-2">
                {["Jardin", "Terrasse", "Balcon"].map((exterior) => (
                  <div key={exterior} className="flex items-center space-x-2">
                    <Checkbox id={exterior} />
                    <Label htmlFor={exterior} className="text-sm">
                      {exterior}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Équipements</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Cuisine équipée", "Baignoire", "Douche", "Lave-vaisselle", "Lave-linge", "Climatisation"].map(
                  (equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox id={equipment} />
                      <Label htmlFor={equipment} className="text-sm">
                        {equipment}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Classe énergétique</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>GES</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              <Button onClick={nextStep}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Vos critères vis-à-vis du locataire</CardTitle>
            <CardDescription>Définissez vos exigences pour sélectionner le bon locataire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="minIncome">Revenus minimum exigés (€/mois) *</Label>
              <Input id="minIncome" type="number" placeholder="3600" />
              <p className="text-xs text-muted-foreground">Généralement 3 fois le loyer charges comprises</p>
            </div>

            <div className="space-y-2">
              <Label>Situation professionnelle acceptée</Label>
              <div className="grid grid-cols-2 gap-2">
                {["CDI", "CDD", "Étudiant", "Freelance", "Retraité", "Autre"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox id={status} defaultChecked />
                    <Label htmlFor={status} className="text-sm">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Garant exigé</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Obligatoire</SelectItem>
                  <SelectItem value="preferred">Préférable</SelectItem>
                  <SelectItem value="not-required">Non nécessaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Durée de location souhaitée</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 mois minimum</SelectItem>
                  <SelectItem value="1year">1 an minimum</SelectItem>
                  <SelectItem value="2years">2 ans minimum</SelectItem>
                  <SelectItem value="longterm">Long terme (3+ ans)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveInDate">Date d'emménagement souhaitée</Label>
              <Input id="moveInDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label>Date pour le versement du loyer</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Le 1er du mois</SelectItem>
                  <SelectItem value="5">Le 5 du mois</SelectItem>
                  <SelectItem value="10">Le 10 du mois</SelectItem>
                  <SelectItem value="15">Le 15 du mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              <Button onClick={nextStep}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Félicitations, votre annonce est créée !
            </CardTitle>
            <CardDescription>Votre bien est maintenant en ligne et visible par les locataires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Votre annonce est en ligne !</h3>
              <p className="text-muted-foreground mb-6">
                Les locataires peuvent maintenant découvrir votre bien et postuler avec leur dossier complet.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Récapitulatif de votre annonce :</h4>
              <ul className="space-y-1 text-sm">
                <li>• Appartement moderne au centre-ville</li>
                <li>• 3 pièces, 2 chambres, 65 m²</li>
                <li>• 1200€/mois + 150€ de charges</li>
                <li>• Revenus minimum : 3600€/mois</li>
                <li>• Disponible immédiatement</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Prochaines étapes :</h4>
              <ul className="space-y-1 text-sm">
                <li>• Vous recevrez les candidatures par email</li>
                <li>• Consultez les dossiers depuis votre tableau de bord</li>
                <li>• Organisez les visites avec les candidats sélectionnés</li>
                <li>• Signez le bail directement sur la plateforme</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1">
                <Link href="/owner/dashboard">Aller au tableau de bord</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/owner/properties/1">Voir mon annonce</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
