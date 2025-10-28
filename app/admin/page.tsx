"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Upload,
  ImageIcon,
  FileText,
  Eye,
  Palette,
  Users,
  Settings,
  BarChart,
  Menu,
  Save,
  UserPlus,
  Shield,
  Building2,
  BarChart3,
  Database,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { authService } from "@/lib/auth-service"

function AdminContent() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [logos, setLogos] = useState({
    main: null,
    icon: null,
    pdf: null,
    watermark: null,
  })
  const [settings, setSettings] = useState({})
  const [activeTab, setActiveTab] = useState("appearance")
  const [primaryColor, setPrimaryColor] = useState("#0066FF")
  const [secondaryColor, setSecondaryColor] = useState("#FF6B00")
  const [accentColor, setAccentColor] = useState("#00C48C")
  const [fontPrimary, setFontPrimary] = useState("Inter")
  const [fontSecondary, setFontSecondary] = useState("Poppins")
  const [headerType, setHeaderType] = useState("standard")
  const [footerType, setFooterType] = useState("standard")
  const [logoPosition, setLogoPosition] = useState("left")
  const [borderRadius, setBorderRadius] = useState(8)
  const [buttonStyle, setButtonStyle] = useState("rounded")
  const [darkMode, setDarkMode] = useState(false)
  const [siteTitle, setSiteTitle] = useState("Louer Ici")
  const [siteDescription, setSiteDescription] = useState("Plateforme de gestion locative intelligente")
  const [inviteEmail, setInviteEmail] = useState("")

  // Vérifier l'authentification admin au chargement
  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      setIsLoading(true)
      const user = await authService.getCurrentUser()

      if (!user) {
        router.push("/login")
        return
      }

      if (user.user_type !== "admin") {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions d'administrateur",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setCurrentUser(user)
      await loadSettings()
    } catch (error) {
      console.error("❌ Erreur vérification admin:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour charger les paramètres
  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Erreur chargement paramètres")
      }

      setSettings(result.data)
      setLogos(result.data.logos || {})

      if (result.data.colors) {
        setPrimaryColor(result.data.colors.primary || "#0066FF")
        setSecondaryColor(result.data.colors.secondary || "#FF6B00")
        setAccentColor(result.data.colors.accent || "#00C48C")
      }
      if (result.data.site_info) {
        setSiteTitle(result.data.site_info.title || "Louer Ici")
        setSiteDescription(result.data.site_info.description || "Plateforme de gestion locative intelligente")
      }
    } catch (error) {
      console.error("Erreur chargement paramètres:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Fonction pour sauvegarder les paramètres
  const saveSettings = async () => {
    try {
      const settingsToSave = {
        colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
        typography: { primary: fontPrimary, secondary: fontSecondary },
        site_info: { title: siteTitle, description: siteDescription },
        layout: { header_type: headerType, footer_type: footerType, logo_position: logoPosition },
        components: { button_style: buttonStyle, border_radius: borderRadius },
        theme: { dark_mode: darkMode },
      }

      for (const [key, value] of Object.entries(settingsToSave)) {
        const response = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || `Erreur sauvegarde ${key}`)
        }
      }

      toast({
        title: "Succès",
        description: "Paramètres sauvegardés avec succès",
      })
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Fonction pour gérer l'upload des logos
  const handleLogoUpload = async (file: File, logoType: string) => {
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("logoType", logoType)

      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Erreur upload")
      }

      setLogos((prev) => ({
        ...prev,
        [logoType]: result.data.url,
      }))

      toast({
        title: "Succès",
        description: `Logo ${logoType} uploadé avec succès`,
      })
    } catch (error) {
      console.error("Erreur upload:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload du logo: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Fonction pour inviter un admin
  const handleInviteAdmin = async () => {
    if (!inviteEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un email",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Erreur invitation")
      }

      toast({
        title: "Succès",
        description: `Invitation envoyée à ${inviteEmail}`,
      })

      setInviteEmail("")
    } catch (error) {
      console.error("Erreur invitation:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'invitation: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await authService.logout()
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès",
      })
      router.push("/login")
    } catch (error) {
      console.error("Erreur déconnexion:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.user_type !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
          <p className="text-gray-600 mb-4">Vous n'avez pas les permissions d'administrateur</p>
          <Button onClick={() => router.push("/")} variant="outline">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  // Prévisualisation des types de header
  const headerPreviews = {
    standard: (
      <div className="border rounded-md p-4 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
            <span className="font-bold">Logo</span>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
          </div>
          <Button size="sm">Connexion</Button>
        </div>
      </div>
    ),
    centered: (
      <div className="border rounded-md p-4 bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
            <span className="font-bold">Logo</span>
          </div>
          <div className="flex gap-6">
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    ),
    minimal: (
      <div className="border rounded-md p-4 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
          </div>
          <Menu className="h-5 w-5" />
        </div>
      </div>
    ),
    split: (
      <div className="border rounded-md p-4 bg-white">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
              <span className="font-bold">Logo</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost">
                Connexion
              </Button>
              <Button size="sm">Inscription</Button>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-center gap-8">
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    ),
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className="border-r">
        <SidebarHeader className="border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{siteTitle}</h2>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
                <button>
                  <BarChart className="h-4 w-4" />
                  <span>Tableau de bord</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={activeTab === "appearance"}
                onClick={() => setActiveTab("appearance")}
              >
                <button>
                  <Palette className="h-4 w-4" />
                  <span>Apparence</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={activeTab === "content"} onClick={() => setActiveTab("content")}>
                <button>
                  <FileText className="h-4 w-4" />
                  <span>Contenu</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={activeTab === "etat-des-lieux"} onClick={() => setActiveTab("etat-des-lieux")}>
                    <button>
                      <Home className="h-4 w-4" />
                      <span>Modèles État des Lieux</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={activeTab === "migrate"} onClick={() => setActiveTab("migrate")}>
                    <button>
                      <Database className="h-4 w-4" />
                      <span>Migration</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={activeTab === "irl-management"} onClick={() => setActiveTab("irl-management")}>
                    <button>
                      <BarChart3 className="h-4 w-4" />
                      <span>Indices IRL</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={activeTab === "users"} onClick={() => setActiveTab("users")}>
                <button>
                  <Users className="h-4 w-4" />
                  <span>Utilisateurs</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={activeTab === "admins"} onClick={() => setActiveTab("admins")}>
                <button>
                  <Shield className="h-4 w-4" />
                  <span>Administrateurs</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
                <button>
                  <Settings className="h-4 w-4" />
                  <span>Paramètres</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  {currentUser?.first_name?.[0]}
                  {currentUser?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {currentUser?.first_name} {currentUser?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">Administrateur</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Administration</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/" target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir le site
                </Link>
              </Button>
              <Button size="sm" onClick={saveSettings} disabled={isUploading}>
                <Save className="h-4 w-4 mr-2" />
                {isUploading ? "Upload en cours..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <AdminDashboard user={currentUser} />
            </div>
          )}

          {activeTab === "admins" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Gestion des Administrateurs</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Inviter un nouvel administrateur
                  </CardTitle>
                  <CardDescription>
                    Envoyez une invitation pour ajouter un nouvel administrateur à la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="invite-email">Email de l'administrateur</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="admin@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleInviteAdmin} disabled={!inviteEmail}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Envoyer l'invitation
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    L'utilisateur recevra un lien d'invitation pour créer son compte administrateur.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Administrateurs actuels</CardTitle>
                  <CardDescription>Liste des administrateurs de la plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-600 text-white">
                            {currentUser?.first_name?.[0]}
                            {currentUser?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {currentUser?.first_name} {currentUser?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Administrateur principal
                        </span>
                        <span className="text-sm text-muted-foreground">Vous</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Apparence</h2>
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </Button>
              </div>

              <Tabs defaultValue="colors">
                <TabsList className="mb-4">
                  <TabsTrigger value="colors">Couleurs</TabsTrigger>
                  <TabsTrigger value="typography">Typographie</TabsTrigger>
                  <TabsTrigger value="layout">Mise en page</TabsTrigger>
                  <TabsTrigger value="components">Composants</TabsTrigger>
                  <TabsTrigger value="logo">Logo</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Couleurs principales</CardTitle>
                      <CardDescription>Définissez les couleurs principales de votre site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="primary-color">Couleur principale</Label>
                          <div className="flex gap-2">
                            <div
                              className="h-10 w-10 rounded-md border"
                              style={{ backgroundColor: primaryColor }}
                            ></div>
                            <Input
                              id="primary-color"
                              type="text"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondary-color">Couleur secondaire</Label>
                          <div className="flex gap-2">
                            <div
                              className="h-10 w-10 rounded-md border"
                              style={{ backgroundColor: secondaryColor }}
                            ></div>
                            <Input
                              id="secondary-color"
                              type="text"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accent-color">Couleur d'accent</Label>
                          <div className="flex gap-2">
                            <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: accentColor }}></div>
                            <Input
                              id="accent-color"
                              type="text"
                              value={accentColor}
                              onChange={(e) => setAccentColor(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Thème sombre</CardTitle>
                      <CardDescription>Activer le mode sombre sur votre site</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dark-mode">Mode sombre</Label>
                          <p className="text-sm text-muted-foreground">
                            Permettre aux utilisateurs de basculer en mode sombre
                          </p>
                        </div>
                        <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prévisualisation</CardTitle>
                      <CardDescription>Aperçu des couleurs sélectionnées</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex gap-2">
                          <div
                            className="h-10 w-32 rounded-md flex items-center justify-center text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Principale
                          </div>
                          <div
                            className="h-10 w-32 rounded-md flex items-center justify-center text-white"
                            style={{ backgroundColor: secondaryColor }}
                          >
                            Secondaire
                          </div>
                          <div
                            className="h-10 w-32 rounded-md flex items-center justify-center text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            Accent
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                            Bouton principal
                          </Button>
                          <Button variant="outline" style={{ borderColor: secondaryColor, color: secondaryColor }}>
                            Bouton secondaire
                          </Button>
                        </div>
                        <div className="p-4 rounded-md" style={{ backgroundColor: `${primaryColor}10` }}>
                          <p className="font-medium" style={{ color: primaryColor }}>
                            Titre de section
                          </p>
                          <p className="text-sm">
                            Texte de contenu avec{" "}
                            <a href="#" style={{ color: accentColor }}>
                              lien d'accent
                            </a>{" "}
                            et plus d'informations.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="typography" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Polices</CardTitle>
                      <CardDescription>Définissez les polices utilisées sur votre site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="font-primary">Police principale</Label>
                          <Select value={fontPrimary} onValueChange={setFontPrimary}>
                            <SelectTrigger id="font-primary">
                              <SelectValue placeholder="Sélectionner une police" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                              <SelectItem value="Montserrat">Montserrat</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">Utilisée pour le texte principal</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="font-secondary">Police secondaire</Label>
                          <Select value={fontSecondary} onValueChange={setFontSecondary}>
                            <SelectTrigger id="font-secondary">
                              <SelectValue placeholder="Sélectionner une police" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                              <SelectItem value="Montserrat">Montserrat</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">Utilisée pour les titres</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prévisualisation</CardTitle>
                      <CardDescription>Aperçu des polices sélectionnées</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 p-4 border rounded-md">
                        <h1 className="text-3xl font-bold" style={{ fontFamily: fontSecondary }}>
                          Titre principal
                        </h1>
                        <h2 className="text-2xl font-semibold" style={{ fontFamily: fontSecondary }}>
                          Sous-titre
                        </h2>
                        <p style={{ fontFamily: fontPrimary }}>
                          Ceci est un exemple de texte utilisant la police principale. Lorem ipsum dolor sit amet,
                          consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie
                          vehicula.
                        </p>
                        <div className="flex gap-2">
                          <Button style={{ fontFamily: fontPrimary }}>Bouton</Button>
                          <Button variant="outline" style={{ fontFamily: fontPrimary }}>
                            Bouton secondaire
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="layout" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>En-tête</CardTitle>
                      <CardDescription>Personnalisez l'en-tête de votre site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Type d'en-tête</Label>
                        <RadioGroup
                          value={headerType}
                          onValueChange={setHeaderType}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="standard" id="header-standard" />
                              <Label htmlFor="header-standard">Standard</Label>
                            </div>
                            <div className="mt-2">{headerPreviews.standard}</div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="centered" id="header-centered" />
                              <Label htmlFor="header-centered">Centré</Label>
                            </div>
                            <div className="mt-2">{headerPreviews.centered}</div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="minimal" id="header-minimal" />
                              <Label htmlFor="header-minimal">Minimal</Label>
                            </div>
                            <div className="mt-2">{headerPreviews.minimal}</div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="split" id="header-split" />
                              <Label htmlFor="header-split">Double niveau</Label>
                            </div>
                            <div className="mt-2">{headerPreviews.split}</div>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>Position du logo</Label>
                        <RadioGroup value={logoPosition} onValueChange={setLogoPosition} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="left" id="logo-left" />
                            <Label htmlFor="logo-left">Gauche</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="center" id="logo-center" />
                            <Label htmlFor="logo-center">Centre</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="right" id="logo-right" />
                            <Label htmlFor="logo-right">Droite</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pied de page</CardTitle>
                      <CardDescription>Personnalisez le pied de page de votre site</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label>Type de pied de page</Label>
                        <Select value={footerType} onValueChange={setFooterType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="expanded">Étendu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="components" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Boutons</CardTitle>
                      <CardDescription>Personnalisez l'apparence des boutons</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Style des boutons</Label>
                        <RadioGroup value={buttonStyle} onValueChange={setButtonStyle} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="rounded" id="button-rounded" />
                            <Label htmlFor="button-rounded">Arrondi</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="square" id="button-square" />
                            <Label htmlFor="button-square">Carré</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="border-radius">Rayon de bordure</Label>
                        <Input
                          id="border-radius"
                          type="number"
                          value={borderRadius}
                          onChange={(e) => setBorderRadius(Number.parseInt(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prévisualisation</CardTitle>
                      <CardDescription>Aperçu des composants sélectionnés</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 p-4 border rounded-md">
                        <Button className={buttonStyle === "rounded" ? "rounded-full" : ""}>Bouton principal</Button>
                        <Button variant="outline" className={buttonStyle === "rounded" ? "rounded-full" : ""}>
                          Bouton secondaire
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logo" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Logos et Branding
                      </CardTitle>
                      <CardDescription>Gérez les différents logos utilisés sur votre plateforme</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Logo principal */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Logo principal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="main-logo">Logo principal (format horizontal)</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("main-logo-input")?.click()}
                            >
                              {logos.main ? (
                                <div className="space-y-2">
                                  <img
                                    src={logos.main || "/placeholder.svg"}
                                    alt="Logo principal"
                                    className="max-h-16 mx-auto"
                                  />
                                  <p className="text-sm text-green-600">Logo uploadé</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Cliquez pour uploader ou glissez-déposez</p>
                                    <p className="text-xs">PNG, JPG jusqu'à 5MB</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="main-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(file, "main")
                                }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              Utilisé dans l'en-tête du site et les documents officiels
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="icon-logo">Icône/Favicon</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("icon-logo-input")?.click()}
                            >
                              {logos.icon ? (
                                <div className="space-y-2">
                                  <img
                                    src={logos.icon || "/placeholder.svg"}
                                    alt="Icône"
                                    className="max-h-12 mx-auto"
                                  />
                                  <p className="text-sm text-green-600">Icône uploadée</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Format carré recommandé</p>
                                    <p className="text-xs">PNG, ICO jusqu'à 5MB</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="icon-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(file, "icon")
                                }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">Utilisé comme favicon et icône d'application</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Logo pour documents */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Logos pour documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="pdf-logo">Logo pour dossiers de location</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("pdf-logo-input")?.click()}
                            >
                              {logos.pdf ? (
                                <div className="space-y-2">
                                  <img
                                    src={logos.pdf || "/placeholder.svg"}
                                    alt="Logo PDF"
                                    className="max-h-12 mx-auto"
                                  />
                                  <p className="text-sm text-green-600">Logo PDF uploadé</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Logo optimisé pour PDF</p>
                                    <p className="text-xs">PNG, JPG haute résolution</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="pdf-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(file, "pdf")
                                }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              Utilisé dans les en-têtes des dossiers de location PDF
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="watermark-logo">Filigrane (optionnel)</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("watermark-logo-input")?.click()}
                            >
                              {logos.watermark ? (
                                <div className="space-y-2">
                                  <img
                                    src={logos.watermark || "/placeholder.svg"}
                                    alt="Filigrane"
                                    className="max-h-12 mx-auto opacity-50"
                                  />
                                  <p className="text-sm text-green-600">Filigrane uploadé</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Eye className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Filigrane transparent</p>
                                    <p className="text-xs">PNG avec transparence</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="watermark-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(file, "watermark")
                                }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">Filigrane discret sur les documents sensibles</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Logos des pages d'authentification */}
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Logos des pages d'authentification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Login gauche */}
                          <div className="space-y-2">
                            <Label htmlFor="login-left-logo">Login - colonne gauche (fond sombre)</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("login-left-logo-input")?.click()}
                            >
                              {logos["login_left"] ? (
                                <div className="space-y-2">
                                  <img src={logos["login_left"] || "/placeholder.svg"} alt="Logo login gauche" className="max-h-16 mx-auto" />
                                  <p className="text-sm text-green-600">Logo uploadé</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Cliquez pour uploader ou glissez-déposez</p>
                                    <p className="text-xs">PNG, JPG jusqu'à 5MB</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="login-left-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file, "login_left") }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">Affiché à gauche sur /login (fond sombre)</p>
                          </div>

                          {/* Login droite */}
                          <div className="space-y-2">
                            <Label htmlFor="login-right-logo">Login - au-dessus du formulaire (fond clair)</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("login-right-logo-input")?.click()}
                            >
                              {logos["login_right"] ? (
                                <div className="space-y-2">
                                  <img src={logos["login_right"] || "/placeholder.svg"} alt="Logo login droite" className="max-h-16 mx-auto" />
                                  <p className="text-sm text-green-600">Logo uploadé</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Cliquez pour uploader ou glissez-déposez</p>
                                    <p className="text-xs">PNG, JPG jusqu'à 5MB</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="login-right-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file, "login_right") }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">Affiché à droite sur /login (fond clair)</p>
                          </div>

                          {/* Register gauche */}
                          <div className="space-y-2">
                            <Label htmlFor="register-left-logo">Register - colonne gauche (fond sombre)</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("register-left-logo-input")?.click()}
                            >
                              {logos["register_left"] ? (
                                <div className="space-y-2">
                                  <img src={logos["register_left"] || "/placeholder.svg"} alt="Logo register gauche" className="max-h-16 mx-auto" />
                                  <p className="text-sm text-green-600">Logo uploadé</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Cliquez pour uploader ou glissez-déposez</p>
                                    <p className="text-xs">PNG, JPG jusqu'à 5MB</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="register-left-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file, "register_left") }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">Affiché à gauche sur /register (fond sombre)</p>
                          </div>

                          {/* Register droite */}
                          <div className="space-y-2">
                            <Label htmlFor="register-right-logo">Register - au-dessus du formulaire (fond clair)</Label>
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => document.getElementById("register-right-logo-input")?.click()}
                            >
                              {logos["register_right"] ? (
                                <div className="space-y-2">
                                  <img src={logos["register_right"] || "/placeholder.svg"} alt="Logo register droite" className="max-h-16 mx-auto" />
                                  <p className="text-sm text-green-600">Logo uploadé</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="text-sm text-gray-600">
                                    <p>Cliquez pour uploader ou glissez-déposez</p>
                                    <p className="text-xs">PNG, JPG jusqu'à 5MB</p>
                                  </div>
                                </div>
                              )}
                              <input
                                id="register-right-logo-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file, "register_right") }}
                                disabled={isUploading}
                              />
                            </div>
                            <p className="text-xs text-gray-500">Affiché à droite sur /register (fond clair)</p>
                          </div>
                        </div>
                      </div>

                      {/* Prévisualisation */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Prévisualisation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>En-tête de site</Label>
                            <div className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {logos.main ? (
                                    <img src={logos.main || "/placeholder.svg"} alt="Logo" className="h-10" />
                                  ) : (
                                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center">
                                      <span className="text-white font-bold text-sm">L</span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-lg">{siteTitle}</div>
                                    <div className="text-xs text-gray-500">{siteDescription}</div>
                                  </div>
                                </div>
                                <Button size="sm">Connexion</Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>En-tête de document PDF</Label>
                            <div className="border rounded-lg p-4 bg-blue-600 text-white">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {logos.pdf ? (
                                    <img
                                      src={logos.pdf || "/placeholder.svg"}
                                      alt="Logo PDF"
                                      className="h-8 bg-white rounded p-1"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                                      <span className="text-blue-600 font-bold text-sm">L</span>
                                    </div>
                                  )}
                                  <span className="font-bold">DOSSIER DE LOCATION</span>
                                </div>
                                <div className="text-right text-sm">
                                  <div>{siteTitle}</div>
                                  <div className="text-xs opacity-80">Document officiel</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Prévisualisation Auth */}
                          <div className="space-y-2">
                            <Label>Page de connexion (aperçu)</Label>
                            <div className="border rounded-lg">
                              <div className="grid grid-cols-2 min-h-[160px]">
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white flex items-center">
                                  <div>
                                    {logos["login_left"] ? (
                                      <img src={logos["login_left"]} alt="login left" className="h-10 mb-3" />
                                    ) : (
                                      <div className="w-10 h-10 bg-white/20 rounded-md" />
                                    )}
                                    <div className="text-sm opacity-80">Colonne gauche</div>
                                  </div>
                                </div>
                                <div className="bg-white p-6">
                                  {logos["login_right"] ? (
                                    <img src={logos["login_right"]} alt="login right" className="h-10 mb-3" />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded-md mb-3" />
                                  )}
                                  <div className="text-sm text-gray-600">Formulaire</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Page d'inscription (aperçu)</Label>
                            <div className="border rounded-lg">
                              <div className="grid grid-cols-2 min-h-[160px]">
                                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white flex items-center">
                                  <div>
                                    {logos["register_left"] ? (
                                      <img src={logos["register_left"]} alt="register left" className="h-10 mb-3" />
                                    ) : (
                                      <div className="w-10 h-10 bg-white/20 rounded-md" />
                                    )}
                                    <div className="text-sm opacity-80">Colonne gauche</div>
                                  </div>
                                </div>
                                <div className="bg-white p-6">
                                  {logos["register_right"] ? (
                                    <img src={logos["register_right"]} alt="register right" className="h-10 mb-3" />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded-md mb-3" />
                                  )}
                                  <div className="text-sm text-gray-600">Formulaire</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "content" && (
            <div>
              <h2 className="text-2xl font-bold">Contenu</h2>
              <p>Gestion du contenu du site (articles, pages, etc.)</p>
            </div>
          )}

          {activeTab === "etat-des-lieux" && (
            <div>
              <iframe
                src="/admin/etat-des-lieux-templates"
                className="w-full h-screen border-0"
                title="Modèles d'État des Lieux"
              />
            </div>
          )}

          {activeTab === "migrate" && (
            <div>
              <iframe
                src="/admin/migrate"
                className="w-full h-screen border-0"
                title="Migration de la Base de Données"
              />
            </div>
          )}

          {activeTab === "irl-management" && (
            <div>
              <iframe
                src="/admin/irl-management"
                className="w-full h-screen border-0"
                title="Gestion des Indices IRL"
              />
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <h2 className="text-2xl font-bold">Utilisateurs</h2>
              <p>Gestion des utilisateurs (propriétaires, locataires, administrateurs)</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold">Paramètres</h2>
              <p>Paramètres généraux du site</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    users: 0,
    properties: 0,
    leases: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRealAdminStats()
  }, [])

  const loadRealAdminStats = async () => {
    try {
      const [usersRes, propertiesRes, leasesRes] = await Promise.all([
        fetch("/api/admin/stats/users").catch(() => ({ ok: false })),
        fetch("/api/admin/stats/properties").catch(() => ({ ok: false })),
        fetch("/api/admin/stats/leases").catch(() => ({ ok: false })),
      ])

      const users = usersRes.ok ? await usersRes.json() : { count: 0 }
      const properties = propertiesRes.ok ? await propertiesRes.json() : { count: 0 }
      const leases = leasesRes.ok ? await leasesRes.json() : { count: 0, revenue: 0 }

      setStats({
        users: users.count || 0,
        properties: properties.count || 0,
        leases: leases.count || 0,
        revenue: leases.revenue || 0,
      })
    } catch (error) {
      console.error("Erreur chargement stats admin:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-gray-600">Chargement...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-gray-600">Bienvenue {user?.first_name} !</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">Total inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties}</div>
            <p className="text-xs text-muted-foreground">Total publiées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leases}</div>
            <p className="text-xs text-muted-foreground">Baux signés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Revenus mensuels</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <SidebarProvider>
      <AdminContent />
      <Toaster />
    </SidebarProvider>
  )
}
