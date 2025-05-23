"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { ColorPicker } from "@/components/settings/color-picker"
import { HeaderPreview } from "@/components/settings/header-preview"
import { LogoUploader } from "@/components/settings/logo-uploader"
import { FontSelector } from "@/components/settings/font-selector"
import { ThemePreview } from "@/components/settings/theme-preview"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Paramètres de la plateforme</h1>
        <p className="text-muted-foreground">Personnalisez l'apparence et configurez les fonctionnalités</p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          {/* Theme Customization */}
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation du thème</CardTitle>
              <CardDescription>
                Modifiez les couleurs, polices et l'apparence générale de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Logo</h3>
                <LogoUploader />
              </div>

              <Separator />

              {/* Color Scheme */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schéma de couleurs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Couleur principale</Label>
                      <ColorPicker color="#0f766e" onChange={() => {}} />
                    </div>
                    <div>
                      <Label>Couleur secondaire</Label>
                      <ColorPicker color="#7c3aed" onChange={() => {}} />
                    </div>
                    <div>
                      <Label>Couleur d'accentuation</Label>
                      <ColorPicker color="#f59e0b" onChange={() => {}} />
                    </div>
                  </div>
                  <div>
                    <ThemePreview />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Typography */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Typographie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Police des titres</Label>
                    <FontSelector
                      fonts={[
                        { name: "Inter", value: "inter" },
                        { name: "Roboto", value: "roboto" },
                        { name: "Montserrat", value: "montserrat" },
                        { name: "Poppins", value: "poppins" },
                        { name: "Open Sans", value: "open-sans" },
                      ]}
                      defaultValue="inter"
                    />
                  </div>
                  <div>
                    <Label>Police du corps de texte</Label>
                    <FontSelector
                      fonts={[
                        { name: "Inter", value: "inter" },
                        { name: "Roboto", value: "roboto" },
                        { name: "Montserrat", value: "montserrat" },
                        { name: "Poppins", value: "poppins" },
                        { name: "Open Sans", value: "open-sans" },
                      ]}
                      defaultValue="roboto"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Taille de base du texte</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une taille" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Petit</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="large">Grand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Espacement des lignes</Label>
                    <Slider defaultValue={[1.5]} min={1} max={2} step={0.1} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Header Style */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Style de l'en-tête</h3>
                <RadioGroup defaultValue="standard">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard">Standard</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="centered" id="centered" />
                      <Label htmlFor="centered">Centré</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="minimal" id="minimal" />
                      <Label htmlFor="minimal">Minimaliste</Label>
                    </div>
                  </div>
                </RadioGroup>
                <HeaderPreview type="standard" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Réinitialiser</Button>
              <Button>Enregistrer les modifications</Button>
            </CardFooter>
          </Card>

          {/* Additional Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Options supplémentaires</CardTitle>
              <CardDescription>Configurez d'autres aspects de l'apparence de votre plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode sombre</Label>
                    <p className="text-sm text-muted-foreground">Activer le mode sombre par défaut</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">Activer les animations de l'interface</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Coins arrondis</Label>
                    <p className="text-sm text-muted-foreground">Niveau d'arrondi des éléments</p>
                  </div>
                  <div className="w-1/3">
                    <Slider defaultValue={[8]} min={0} max={16} step={1} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Enregistrer les modifications</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Configurez les informations de base de votre plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Nom de la plateforme</Label>
                  <Input id="platform-name" defaultValue="ImmoConnect" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email de contact</Label>
                  <Input id="contact-email" type="email" defaultValue="contact@immoconnect.fr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-description">Description</Label>
                <Input
                  id="platform-description"
                  defaultValue="Plateforme de gestion locative pour propriétaires et locataires"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-address">Adresse</Label>
                <Input id="platform-address" defaultValue="123 Avenue des Champs-Élysées, 75008 Paris" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Enregistrer</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres régionaux</CardTitle>
              <CardDescription>Configurez les paramètres spécifiques à votre région</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue par défaut</Label>
                  <Select defaultValue="fr">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Sélectionnez une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                      <SelectItem value="es">Espagnol</SelectItem>
                      <SelectItem value="de">Allemand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select defaultValue="eur">
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">Euro (€)</SelectItem>
                      <SelectItem value="usd">Dollar US ($)</SelectItem>
                      <SelectItem value="gbp">Livre Sterling (£)</SelectItem>
                      <SelectItem value="chf">Franc Suisse (CHF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date-format">Format de date</Label>
                  <Select defaultValue="dd/mm/yyyy">
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Sélectionnez un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="yyyy-mm-dd">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select defaultValue="europe-paris">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Sélectionnez un fuseau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-paris">Europe/Paris</SelectItem>
                      <SelectItem value="europe-london">Europe/Londres</SelectItem>
                      <SelectItem value="america-new_york">Amérique/New York</SelectItem>
                      <SelectItem value="asia-tokyo">Asie/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Enregistrer</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
              <CardDescription>Configurez comment et quand les notifications sont envoyées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications par email</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nouveaux utilisateurs</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir une notification lors de l'inscription d'un nouvel utilisateur
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nouvelles propriétés</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir une notification lors de l'ajout d'une nouvelle propriété
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nouveaux baux</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir une notification lors de la création d'un nouveau bail
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Paiements en retard</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir une notification pour les paiements en retard
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications système</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rapports quotidiens</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir un rapport quotidien des activités de la plateforme
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertes de sécurité</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des alertes concernant la sécurité de la plateforme
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mises à jour système</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications lors des mises à jour du système
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Enregistrer les préférences</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modèles d'emails</CardTitle>
              <CardDescription>Personnalisez les modèles d'emails envoyés par la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sélectionnez un modèle à modifier</Label>
                  <Select defaultValue="welcome">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Email de bienvenue</SelectItem>
                      <SelectItem value="reset-password">Réinitialisation de mot de passe</SelectItem>
                      <SelectItem value="new-lease">Nouveau bail</SelectItem>
                      <SelectItem value="payment-reminder">Rappel de paiement</SelectItem>
                      <SelectItem value="visit-confirmation">Confirmation de visite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 border rounded-md bg-slate-50 h-64">
                  <p className="text-center text-muted-foreground">
                    Éditeur de modèle d'email (interface complète à implémenter)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Réinitialiser</Button>
              <Button>Enregistrer le modèle</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres avancés</CardTitle>
              <CardDescription>Configuration avancée de la plateforme (réservé aux administrateurs)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sécurité</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Authentification à deux facteurs</Label>
                      <p className="text-sm text-muted-foreground">
                        Exiger l'authentification à deux facteurs pour tous les utilisateurs
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Délai d'expiration de session</Label>
                      <p className="text-sm text-muted-foreground">Durée avant l'expiration automatique des sessions</p>
                    </div>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sélectionnez une durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                        <SelectItem value="240">4 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mise en cache</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer la mise en cache pour améliorer les performances
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Durée de cache</Label>
                      <p className="text-sm text-muted-foreground">Durée de conservation des données en cache</p>
                    </div>
                    <Select defaultValue="3600">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sélectionnez une durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="900">15 minutes</SelectItem>
                        <SelectItem value="1800">30 minutes</SelectItem>
                        <SelectItem value="3600">1 heure</SelectItem>
                        <SelectItem value="86400">1 jour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Maintenance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mode maintenance</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer le mode maintenance (site inaccessible aux utilisateurs)
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Message de maintenance</Label>
                    <Input defaultValue="Notre site est actuellement en maintenance. Merci de revenir plus tard." />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="destructive">Activer le mode maintenance</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sauvegarde et restauration</CardTitle>
              <CardDescription>Gérez les sauvegardes de votre plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Sauvegardes automatiques</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activer les sauvegardes automatiques</Label>
                    <p className="text-sm text-muted-foreground">
                      Sauvegarder automatiquement les données de la plateforme
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Fréquence des sauvegardes</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Sauvegarde manuelle</h3>
                <p className="text-sm text-muted-foreground">
                  Créez une sauvegarde complète de votre plateforme maintenant
                </p>
                <Button>Créer une sauvegarde</Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Restauration</h3>
                <p className="text-sm text-muted-foreground">
                  Restaurez votre plateforme à partir d'une sauvegarde précédente
                </p>
                <div className="p-4 border rounded-md bg-slate-50">
                  <p className="text-center text-muted-foreground">Interface de restauration (à implémenter)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
