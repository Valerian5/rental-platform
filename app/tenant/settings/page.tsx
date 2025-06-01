"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Bell, Shield, CreditCard, User, Globe, Trash2, Download, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function TenantSettingsPage() {
  const [notifications, setNotifications] = useState({
    newProperties: true,
    priceDrops: true,
    visitReminders: true,
    messages: true,
    applicationUpdates: true,
    emailDigest: false,
    smsNotifications: false,
    pushNotifications: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "landlords",
    showContactInfo: false,
    dataSharing: false,
    analyticsTracking: true,
  })

  const [preferences, setPreferences] = useState({
    language: "fr",
    currency: "EUR",
    timeZone: "Europe/Paris",
    theme: "light",
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    toast.success("Préférences de notification mises à jour")
  }

  const handlePrivacyChange = (key: string, value: any) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }))
    toast.success("Paramètres de confidentialité mis à jour")
  }

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    toast.success("Préférences mises à jour")
  }

  const exportData = () => {
    toast.success("Export des données en cours... Vous recevrez un email avec vos données")
  }

  const deleteAccount = () => {
    toast.error("Suppression du compte en cours...")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et paramètres de compte</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Confidentialité
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Compte
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Préférences
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Facturation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications push</CardTitle>
                  <CardDescription>
                    Gérez les notifications que vous souhaitez recevoir sur votre appareil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Nouvelles propriétés</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des alertes pour les nouvelles propriétés correspondant à vos critères
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newProperties}
                      onCheckedChange={(checked) => handleNotificationChange("newProperties", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Baisses de prix</Label>
                      <p className="text-sm text-muted-foreground">Être notifié quand le prix d'une propriété baisse</p>
                    </div>
                    <Switch
                      checked={notifications.priceDrops}
                      onCheckedChange={(checked) => handleNotificationChange("priceDrops", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Rappels de visite</Label>
                      <p className="text-sm text-muted-foreground">Rappels 24h avant vos visites programmées</p>
                    </div>
                    <Switch
                      checked={notifications.visitReminders}
                      onCheckedChange={(checked) => handleNotificationChange("visitReminders", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Messages</Label>
                      <p className="text-sm text-muted-foreground">Nouveaux messages des propriétaires</p>
                    </div>
                    <Switch
                      checked={notifications.messages}
                      onCheckedChange={(checked) => handleNotificationChange("messages", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Mises à jour de candidature</Label>
                      <p className="text-sm text-muted-foreground">Changements de statut de vos candidatures</p>
                    </div>
                    <Switch
                      checked={notifications.applicationUpdates}
                      onCheckedChange={(checked) => handleNotificationChange("applicationUpdates", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications par email</CardTitle>
                  <CardDescription>Configurez les emails que vous souhaitez recevoir</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Résumé hebdomadaire</Label>
                      <p className="text-sm text-muted-foreground">Recevez un résumé de vos activités chaque semaine</p>
                    </div>
                    <Switch
                      checked={notifications.emailDigest}
                      onCheckedChange={(checked) => handleNotificationChange("emailDigest", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Notifications SMS</Label>
                      <p className="text-sm text-muted-foreground">Notifications urgentes par SMS</p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("smsNotifications", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visibilité du profil</CardTitle>
                  <CardDescription>Contrôlez qui peut voir votre profil et vos informations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-base">Qui peut voir mon profil ?</Label>
                    <Select
                      value={privacy.profileVisibility}
                      onValueChange={(value) => handlePrivacyChange("profileVisibility", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Tout le monde</SelectItem>
                        <SelectItem value="landlords">Propriétaires uniquement</SelectItem>
                        <SelectItem value="nobody">Personne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Afficher mes informations de contact</Label>
                      <p className="text-sm text-muted-foreground">
                        Permettre aux propriétaires de voir votre email et téléphone
                      </p>
                    </div>
                    <Switch
                      checked={privacy.showContactInfo}
                      onCheckedChange={(checked) => handlePrivacyChange("showContactInfo", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Partage de données</Label>
                      <p className="text-sm text-muted-foreground">
                        Autoriser le partage de données anonymes avec nos partenaires
                      </p>
                    </div>
                    <Switch
                      checked={privacy.dataSharing}
                      onCheckedChange={(checked) => handlePrivacyChange("dataSharing", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Suivi analytique</Label>
                      <p className="text-sm text-muted-foreground">Nous aider à améliorer l'expérience utilisateur</p>
                    </div>
                    <Switch
                      checked={privacy.analyticsTracking}
                      onCheckedChange={(checked) => handlePrivacyChange("analyticsTracking", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gestion des données</CardTitle>
                  <CardDescription>Exportez ou supprimez vos données personnelles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Exporter mes données</Label>
                      <p className="text-sm text-muted-foreground">Téléchargez une copie de toutes vos données</p>
                    </div>
                    <Button variant="outline" onClick={exportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Mettez à jour vos informations de compte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" defaultValue="Jean" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" defaultValue="Dupont" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="jean.dupont@example.com" />
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" type="tel" defaultValue="06 12 34 56 78" />
                  </div>

                  <Button>Sauvegarder les modifications</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Gérez votre mot de passe et la sécurité de votre compte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Entrez votre mot de passe actuel"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input id="newPassword" type="password" placeholder="Entrez votre nouveau mot de passe" />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirmez votre nouveau mot de passe" />
                  </div>

                  <Button>Changer le mot de passe</Button>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Authentification à deux facteurs</Label>
                      <p className="text-sm text-muted-foreground">Renforcez la sécurité de votre compte</p>
                    </div>
                    <Badge variant="outline">Non configuré</Badge>
                  </div>

                  <Button variant="outline">Configurer l'authentification 2FA</Button>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Zone de danger</CardTitle>
                  <CardDescription>Actions irréversibles concernant votre compte</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer mon compte
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Toutes vos données seront définitivement supprimées, y compris
                          votre dossier de location, vos candidatures et vos conversations.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Langue et région</CardTitle>
                  <CardDescription>Personnalisez l'affichage selon vos préférences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Langue</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => handlePreferenceChange("language", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Devise</Label>
                    <Select
                      value={preferences.currency}
                      onValueChange={(value) => handlePreferenceChange("currency", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">Dollar ($)</SelectItem>
                        <SelectItem value="GBP">Livre Sterling (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fuseau horaire</Label>
                    <Select
                      value={preferences.timeZone}
                      onValueChange={(value) => handlePreferenceChange("timeZone", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                        <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                        <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Apparence</CardTitle>
                  <CardDescription>Choisissez comment l'interface s'affiche</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Thème</Label>
                    <Select value={preferences.theme} onValueChange={(value) => handlePreferenceChange("theme", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="system">Automatique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Informations de facturation</CardTitle>
                <CardDescription>Actuellement, notre plateforme est gratuite pour les locataires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="h-12 w-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Service gratuit</h3>
                  <p className="text-muted-foreground mb-4">
                    L'utilisation de notre plateforme est entièrement gratuite pour les locataires. Aucune facturation
                    n'est nécessaire.
                  </p>
                  <Badge variant="secondary">Plan Gratuit</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
