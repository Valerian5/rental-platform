"use client"

import { useState } from "react"
import Link from "next/link"
import { Settings, Users, Palette, FileText, Save, Eye, Menu, Home, Bell, MessageSquare, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"

export default function AdminPage() {
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
            <div className="h-8 w-8 rounded-md bg-blue-600"></div>
            <div>
              <h2 className="text-lg font-bold">Louer Ici</h2>
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
              <SidebarMenuButton asChild isActive={activeTab === "users"} onClick={() => setActiveTab("users")}>
                <button>
                  <Users className="h-4 w-4" />
                  <span>Utilisateurs</span>
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
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">admin@louerici.fr</p>
            </div>
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
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Tableau de bord</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Propriétaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">+3 ce mois-ci</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Locataires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">+12 ce mois-ci</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Biens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">87</div>
                    <p className="text-xs text-muted-foreground">42 disponibles</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contrats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">+5 ce mois-ci</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>Les dernières actions sur la plateforme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Home className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Nouveau bien ajouté</p>
                          <p className="text-xs text-muted-foreground">Appartement 3 pièces à Paris</p>
                          <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-green-100 p-2">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Nouveau propriétaire inscrit</p>
                          <p className="text-xs text-muted-foreground">Jean Dupont</p>
                          <p className="text-xs text-muted-foreground">Il y a 5 heures</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-amber-100 p-2">
                          <FileText className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Contrat signé</p>
                          <p className="text-xs text-muted-foreground">Studio à Lyon</p>
                          <p className="text-xs text-muted-foreground">Il y a 1 jour</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tâches administratives</CardTitle>
                    <CardDescription>Actions à effectuer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-red-100 p-2">
                            <Bell className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Vérifier les documents</p>
                            <p className="text-xs text-muted-foreground">3 dossiers en attente</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Voir
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-blue-100 p-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Messages non lus</p>
                            <p className="text-xs text-muted-foreground">5 messages</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Voir
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-amber-100 p-2">
                            <Settings className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Mise à jour système</p>
                            <p className="text-xs text-muted-foreground">Nouvelle version disponible</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Installer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Apparence</h2>
                <Button>
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
                      <CardTitle>Logo et Titre</CardTitle>
                      <CardDescription>Personnalisez le logo et le titre de votre site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="site-title">Titre du site</Label>
                        <Input
                          id="site-title"
                          type="text"
                          value={siteTitle}
                          onChange={(e) => setSiteTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="site-description">Description du site</Label>
                        <Input
                          id="site-description"
                          type="text"
                          value={siteDescription}
                          onChange={(e) => setSiteDescription(e.target.value)}
                        />
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