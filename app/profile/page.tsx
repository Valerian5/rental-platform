import { User, Mail, Phone, Home, FileText, CreditCard, Settings, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Exemple de données utilisateur
const user = {
  name: "Jean Dupont",
  email: "jean.dupont@example.com",
  phone: "06 12 34 56 78",
  address: "123 Rue Principale, 75001 Paris",
  role: "Propriétaire",
  avatar: "/placeholder.svg?height=100&width=100&text=JD",
  joinDate: "2022-01-15",
}

// Exemple de données de propriétés
const properties = [
  {
    id: 1,
    title: "Appartement moderne au centre-ville",
    address: "123 Rue Principale, Paris",
    status: "Loué",
    tenant: "Sophie Martin",
    rentAmount: 1200,
  },
  {
    id: 2,
    title: "Studio étudiant rénové",
    address: "78 Rue des Étudiants, Bordeaux",
    status: "Disponible",
    tenant: null,
    rentAmount: 550,
  },
]

// Exemple de données de contrats
const contracts = [
  {
    id: 1,
    property: "Appartement moderne au centre-ville",
    tenant: "Sophie Martin",
    startDate: "2023-01-15",
    endDate: "2024-01-14",
    status: "Actif",
  },
]

// Exemple de données de paiements
const payments = [
  {
    id: 1,
    property: "Appartement moderne au centre-ville",
    date: "2023-05-03",
    amount: 1200,
    status: "Payé",
  },
  {
    id: 2,
    property: "Appartement moderne au centre-ville",
    date: "2023-04-05",
    amount: 1200,
    status: "Payé",
  },
]

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>
                <Badge>{user.role}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{user.phone}</span>
                </div>
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{user.address}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Modifier le profil
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-6 space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Mon profil
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Home className="h-4 w-4 mr-2" />
              Mes biens
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Mes contrats
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Mes paiements
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="properties">Mes biens</TabsTrigger>
              <TabsTrigger value="contracts">Contrats</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input id="name" defaultValue={user.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={user.email} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" defaultValue={user.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle</Label>
                      <Select defaultValue={user.role.toLowerCase()}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proprietaire">Propriétaire</SelectItem>
                          <SelectItem value="locataire">Locataire</SelectItem>
                          <SelectItem value="les-deux">Les deux</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" defaultValue={user.address} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biographie</Label>
                    <Textarea id="bio" placeholder="Parlez-nous de vous..." rows={4} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>Enregistrer les modifications</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="properties">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Mes biens immobiliers</h2>
                <Button>Ajouter un bien</Button>
              </div>

              {properties.length > 0 ? (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <Card key={property.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                            <p className="text-sm text-muted-foreground">{property.address}</p>
                            <div className="flex items-center mt-2">
                              <Badge variant={property.status === "Disponible" ? "default" : "secondary"}>
                                {property.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 md:text-right">
                            <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                            <p className="font-bold">{property.rentAmount} €</p>
                            {property.tenant && (
                              <p className="text-sm mt-2">
                                <span className="text-muted-foreground">Locataire :</span> {property.tenant}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm">
                            Gérer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">Aucun bien immobilier</h3>
                    <p className="text-muted-foreground mb-4">Vous n'avez pas encore ajouté de bien immobilier.</p>
                    <Button>Ajouter un bien</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="contracts">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Mes contrats</h2>
                <Button>Nouveau contrat</Button>
              </div>

              {contracts.length > 0 ? (
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <Card key={contract.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{contract.property}</h3>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Locataire :</span> {contract.tenant}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0 md:text-right">
                            <Badge variant={contract.status === "Actif" ? "default" : "secondary"}>
                              {contract.status}
                            </Badge>
                            <p className="text-sm mt-2">
                              <span className="text-muted-foreground">Période :</span>{" "}
                              {new Date(contract.startDate).toLocaleDateString("fr-FR")} -{" "}
                              {new Date(contract.endDate).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm" className="mr-2">
                            Voir
                          </Button>
                          <Button variant="outline" size="sm">
                            Télécharger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">Aucun contrat</h3>
                    <p className="text-muted-foreground mb-4">Vous n'avez pas encore de contrats actifs.</p>
                    <Button>Créer un contrat</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="payments">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Mes paiements</h2>
                <Select defaultValue="current">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Mois en cours</SelectItem>
                    <SelectItem value="last">Mois précédent</SelectItem>
                    <SelectItem value="all">Tous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{payment.property}</h3>
                            <p className="text-sm text-muted-foreground">
                              Payé le {new Date(payment.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0 md:text-right">
                            <p className="font-bold">{payment.amount} €</p>
                            <Badge variant={payment.status === "Payé" ? "success" : "destructive"} className="mt-2">
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm">
                            Reçu
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">Aucun paiement</h3>
                    <p className="text-muted-foreground">Vous n'avez pas encore de paiements enregistrés.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres du compte</CardTitle>
                  <CardDescription>Gérez les paramètres de votre compte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notif">Notifications par email</Label>
                        <Switch id="email-notif" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="payment-notif">Alertes de paiement</Label>
                        <Switch id="payment-notif" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="contract-notif">Alertes de contrat</Label>
                        <Switch id="contract-notif" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketing-notif">Communications marketing</Label>
                        <Switch id="marketing-notif" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Sécurité</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        Changer le mot de passe
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Activer l'authentification à deux facteurs
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Préférences de paiement</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        Gérer les méthodes de paiement
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Historique des factures
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="destructive">Supprimer mon compte</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
