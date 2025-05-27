"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { User, Bell, Shield, CreditCard, Save, Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    bio: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [notifications, setNotifications] = useState({
    email_applications: true,
    email_visits: true,
    email_payments: true,
    email_messages: true,
    sms_urgent: false,
    push_notifications: true,
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser || currentUser.user_type !== "owner") {
        router.push("/login")
        return
      }

      setUser(currentUser)
      setFormData({
        first_name: currentUser.first_name || "",
        last_name: currentUser.last_name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        company: currentUser.company || "",
        bio: currentUser.bio || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    } catch (error) {
      console.error("Erreur auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        company: formData.company,
        bio: formData.bio,
      }

      await authService.updateProfile(updateData)
      toast.success("Profil mis à jour avec succès")
    } catch (error) {
      console.error("Erreur mise à jour profil:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    }
  }

  const handlePasswordChange = async () => {
    if (formData.new_password !== formData.confirm_password) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    if (formData.new_password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    try {
      await authService.changePassword(formData.current_password, formData.new_password)
      toast.success("Mot de passe modifié avec succès")
      setFormData({
        ...formData,
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    } catch (error) {
      console.error("Erreur changement mot de passe:", error)
      toast.error("Erreur lors du changement de mot de passe")
    }
  }

  const handleNotificationUpdate = async () => {
    try {
      // Ici vous pouvez sauvegarder les préférences de notification
      toast.success("Préférences de notification mises à jour")
    } catch (error) {
      console.error("Erreur mise à jour notifications:", error)
      toast.error("Erreur lors de la mise à jour des notifications")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences de compte</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos préférences de compte</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informations personnelles
              </CardTitle>
              <CardDescription>Mettez à jour vos informations de profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} disabled className="bg-gray-50" />
                <p className="text-xs text-muted-foreground mt-1">
                  L'email ne peut pas être modifié. Contactez le support si nécessaire.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Société (optionnel)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Présentation</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Présentez-vous en quelques mots..."
                  rows={4}
                />
              </div>

              <Button onClick={handleProfileUpdate}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les modifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Sécurité du compte
              </CardTitle>
              <CardDescription>Modifiez votre mot de passe et gérez la sécurité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="current_password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? "text" : "password"}
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <Input
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                />
              </div>

              <Button onClick={handlePasswordChange}>
                <Save className="h-4 w-4 mr-2" />
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Préférences de notification
              </CardTitle>
              <CardDescription>Choisissez comment vous souhaitez être notifié</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notifications par email</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_applications">Nouvelles candidatures</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir un email pour chaque nouvelle candidature
                      </p>
                    </div>
                    <Switch
                      id="email_applications"
                      checked={notifications.email_applications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_applications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_visits">Visites programmées</Label>
                      <p className="text-sm text-muted-foreground">Recevoir un email pour les nouvelles visites</p>
                    </div>
                    <Switch
                      id="email_visits"
                      checked={notifications.email_visits}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_visits: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_payments">Paiements</Label>
                      <p className="text-sm text-muted-foreground">Recevoir un email pour les paiements reçus</p>
                    </div>
                    <Switch
                      id="email_payments"
                      checked={notifications.email_payments}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_payments: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_messages">Messages</Label>
                      <p className="text-sm text-muted-foreground">Recevoir un email pour les nouveaux messages</p>
                    </div>
                    <Switch
                      id="email_messages"
                      checked={notifications.email_messages}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_messages: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Autres notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms_urgent">SMS urgents</Label>
                      <p className="text-sm text-muted-foreground">Recevoir des SMS pour les urgences uniquement</p>
                    </div>
                    <Switch
                      id="sms_urgent"
                      checked={notifications.sms_urgent}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms_urgent: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push_notifications">Notifications push</Label>
                      <p className="text-sm text-muted-foreground">Recevoir des notifications dans le navigateur</p>
                    </div>
                    <Switch
                      id="push_notifications"
                      checked={notifications.push_notifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push_notifications: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleNotificationUpdate}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Facturation */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Facturation et abonnement
              </CardTitle>
              <CardDescription>Gérez votre abonnement et vos moyens de paiement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Plan actuel : Gratuit</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Vous utilisez actuellement le plan gratuit. Passez au plan Pro pour débloquer plus de fonctionnalités.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Fonctionnalités disponibles</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Jusqu'à 5 propriétés
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Gestion des candidatures
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Planning des visites
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    Statistiques avancées (Pro)
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    Gestion locative complète (Pro)
                  </li>
                </ul>
              </div>

              <Button className="w-full">Passer au plan Pro - 29€/mois</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
