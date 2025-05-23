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
import { ArrowLeft, ArrowRight, User, Briefcase, Home, Upload, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function RentalFilePage() {
  const [step, setStep] = useState(1)
  const totalSteps = 5

  const nextStep = () => setStep(Math.min(step + 1, totalSteps))
  const prevStep = () => setStep(Math.max(step - 1, 1))

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/tenant/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au tableau de bord
        </Link>
        <h1 className="text-3xl font-bold mb-2">Création de votre dossier de location</h1>
        <p className="text-muted-foreground">Constituez votre dossier une seule fois pour postuler rapidement</p>
      </div>

      <div className="mb-8">
        <Progress value={(step / totalSteps) * 100} className="mb-4" />
        <div className="flex justify-between text-xs">
          <span className={step >= 1 ? "text-blue-600 font-medium" : "text-muted-foreground"}>Profil</span>
          <span className={step >= 2 ? "text-blue-600 font-medium" : "text-muted-foreground"}>Situation</span>
          <span className={step >= 3 ? "text-blue-600 font-medium" : "text-muted-foreground"}>Projet</span>
          <span className={step >= 4 ? "text-blue-600 font-medium" : "text-muted-foreground"}>Justificatifs</span>
          <span className={step >= 5 ? "text-blue-600 font-medium" : "text-muted-foreground"}>Finalisation</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Ton profil
            </CardTitle>
            <CardDescription>Vos informations personnelles</CardDescription>
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
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="votre.email@exemple.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone *</Label>
              <Input id="phone" placeholder="06 12 34 56 78" />
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
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Ta situation
            </CardTitle>
            <CardDescription>Informations sur votre situation professionnelle et financière</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Nombre de locataires *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 personne</SelectItem>
                  <SelectItem value="2">2 personnes</SelectItem>
                  <SelectItem value="3">3 personnes</SelectItem>
                  <SelectItem value="4">4+ personnes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ton statut *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cdi">CDI</SelectItem>
                  <SelectItem value="cdd">CDD</SelectItem>
                  <SelectItem value="student">Étudiant</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="unemployed">Sans emploi</SelectItem>
                  <SelectItem value="retired">Retraité</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="income">Tes revenus nets mensuels (avant impôts) *</Label>
              <Input id="income" type="number" placeholder="2500" />
              <p className="text-xs text-muted-foreground">En euros par mois</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="additionalIncome" />
                <Label htmlFor="additionalIncome">J'ai des revenus complémentaires</Label>
              </div>
              <Input placeholder="Montant des revenus complémentaires (€/mois)" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="hasGuarantor" />
                <Label htmlFor="hasGuarantor">J'ai un ou des garants</Label>
              </div>
              <div className="ml-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Nom du garant" />
                  <Input placeholder="Prénom du garant" />
                </div>
                <Input placeholder="Revenus du garant (€/mois)" type="number" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut du garant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cdi">CDI</SelectItem>
                    <SelectItem value="cdd">CDD</SelectItem>
                    <SelectItem value="retired">Retraité</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
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
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Ton projet
            </CardTitle>
            <CardDescription>Parlez-nous de votre projet de location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="presentation">Formulaire de présentation *</Label>
              <Textarea
                id="presentation"
                placeholder="Présentez-vous en quelques lignes : qui êtes-vous, pourquoi cherchez-vous un logement, etc."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveInDate">Quand souhaites-tu emménager ? *</Label>
              <Input id="moveInDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label>Pour quelle durée ? *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la durée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 mois</SelectItem>
                  <SelectItem value="1year">1 an</SelectItem>
                  <SelectItem value="2years">2 ans</SelectItem>
                  <SelectItem value="3years">3 ans</SelectItem>
                  <SelectItem value="longterm">Long terme (3+ ans)</SelectItem>
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
              <Upload className="h-5 w-5 mr-2" />
              Tes justificatifs
            </CardTitle>
            <CardDescription>Ajoutez vos documents pour compléter votre dossier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <h4 className="font-medium mb-1">3 dernières fiches de paie *</h4>
                <p className="text-sm text-muted-foreground mb-3">Formats acceptés : PDF, JPG, PNG</p>
                <Button variant="outline" size="sm">
                  Choisir les fichiers
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <h4 className="font-medium mb-1">3 dernières quittances de loyer</h4>
                <p className="text-sm text-muted-foreground mb-3">Si vous êtes déjà locataire</p>
                <Button variant="outline" size="sm">
                  Choisir les fichiers
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <h4 className="font-medium mb-1">Dernier avis d'imposition *</h4>
                <p className="text-sm text-muted-foreground mb-3">Ou avis de non-imposition</p>
                <Button variant="outline" size="sm">
                  Choisir le fichier
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <h4 className="font-medium mb-1">Carte d'identité *</h4>
                <p className="text-sm text-muted-foreground mb-3">Recto et verso</p>
                <Button variant="outline" size="sm">
                  Choisir les fichiers
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>💡 Conseil :</strong> Assurez-vous que tous vos documents sont lisibles et à jour. Un dossier
                complet augmente vos chances d'être sélectionné par les propriétaires.
              </p>
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

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Ton dossier est créé !
            </CardTitle>
            <CardDescription>Félicitations, votre dossier de location est maintenant complet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Votre dossier est prêt !</h3>
              <p className="text-muted-foreground mb-6">
                Vous pouvez maintenant postuler aux annonces en un seul clic. Votre dossier sera automatiquement
                transmis aux propriétaires.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-800">Votre dossier contient :</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✓ Informations personnelles complètes</li>
                <li>✓ Situation professionnelle et financière</li>
                <li>✓ Présentation de votre projet</li>
                <li>✓ Justificatifs requis</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1">
                <Link href="/properties">Rechercher des logements</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/tenant/dashboard">Aller au tableau de bord</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
