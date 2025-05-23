import { TenantProfileForm } from "@/components/tenant-profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TenantProfilePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et vos préférences de recherche</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Informations personnelles</TabsTrigger>
          <TabsTrigger value="preferences">Préférences de recherche</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de contact et votre situation professionnelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de recherche</CardTitle>
              <CardDescription>
                Définissez vos critères de recherche pour recevoir des recommandations personnalisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Fonctionnalité en cours de développement...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Mes documents</CardTitle>
              <CardDescription>Gérez vos documents pour constituer votre dossier de location</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Fonctionnalité en cours de développement...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
