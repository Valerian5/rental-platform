"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, User, Search, FileText } from "lucide-react"
import Link from "next/link"

export default function TenantRegisterPage() {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const nextStep = () => setStep(Math.min(step + 1, totalSteps))
  const prevStep = () => setStep(Math.max(step - 1, 1))

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à l'accueil
        </Link>
        <h1 className="text-3xl font-bold mb-2">Créer mon profil locataire</h1>
        <p className="text-muted-foreground">Trouvez votre logement idéal en quelques étapes</p>
      </div>

      <div className="mb-8">
        <Progress value={(step / totalSteps) * 100} className="mb-4" />
        <div className="flex justify-between text-sm">
          <span className={step >= 1 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <User className="h-4 w-4 inline mr-1" />
            Informations personnelles
          </span>
          <span className={step >= 2 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <Search className="h-4 w-4 inline mr-1" />
            Critères de recherche
          </span>
          <span className={step >= 3 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            <FileText className="h-4 w-4 inline mr-1" />
            Finalisation
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
              <Label htmlFor="city">Ville actuelle *</Label>
              <Input id="city" placeholder="Votre ville actuelle" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-sm">
                J'accepte les{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  conditions d'utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  politique de confidentialité
                </Link>
              </Label>
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
            <CardTitle>Créez votre première recherche</CardTitle>
            <CardDescription>Définissez vos critères pour trouver le logement idéal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="searchCity">Ville recherchée *</Label>
              <Input id="searchCity" placeholder="Dans quelle ville cherchez-vous ?" />
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

            <div className="space-y-2">
              <Label htmlFor="maxRent">Loyer maximum (€) *</Label>
              <Input id="maxRent" type="number" placeholder="1200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de pièces minimum</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Indifférent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 pièce</SelectItem>
                    <SelectItem value="2">2 pièces</SelectItem>
                    <SelectItem value="3">3 pièces</SelectItem>
                    <SelectItem value="4">4 pièces</SelectItem>
                    <SelectItem value="5">5+ pièces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nombre de chambres minimum</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Indifférent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 chambre</SelectItem>
                    <SelectItem value="2">2 chambres</SelectItem>
                    <SelectItem value="3">3 chambres</SelectItem>
                    <SelectItem value="4">4+ chambres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSurface">Surface minimum (m²)</Label>
                <Input id="minSurface" type="number" placeholder="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSurface">Surface maximum (m²)</Label>
                <Input id="maxSurface" type="number" placeholder="100" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Équipements souhaités</Label>
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

            <div className="space-y-2">
              <Label>Parking</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Indifférent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Oui, obligatoire</SelectItem>
                  <SelectItem value="no">Non nécessaire</SelectItem>
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

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Félicitations !</CardTitle>
            <CardDescription>Votre profil locataire a été créé avec succès</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Votre profil est prêt !</h3>
              <p className="text-muted-foreground mb-6">
                Vous pouvez maintenant rechercher des logements et postuler aux annonces qui vous intéressent.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Prochaines étapes recommandées :</h4>
              <ul className="space-y-1 text-sm">
                <li>• Complétez votre dossier de location pour postuler plus rapidement</li>
                <li>• Explorez les annonces correspondant à vos critères</li>
                <li>• Configurez des alertes pour être notifié des nouvelles annonces</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1">
                <Link href="/tenant/profile/rental-file">Créer mon dossier de location</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/properties">Voir les annonces</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
