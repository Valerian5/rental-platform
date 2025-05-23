import { TenantApplicationForm } from "@/components/tenant-application-form"
import { ApplicationStatus } from "@/components/application-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TenantApplicationPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Dossier de Location</h1>
        <p className="text-muted-foreground">Créez et gérez votre dossier de candidature</p>
      </div>

      <Tabs defaultValue="application" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="application">Mon dossier</TabsTrigger>
          <TabsTrigger value="status">Suivi des candidatures</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="application">
          <Card>
            <CardHeader>
              <CardTitle>Dossier de location</CardTitle>
              <CardDescription>Complétez votre dossier pour postuler aux biens qui vous intéressent</CardDescription>
            </CardHeader>
            <CardContent>
              <TenantApplicationForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des candidatures</CardTitle>
              <CardDescription>Suivez l'état de vos candidatures en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationStatus />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des documents</CardTitle>
              <CardDescription>Téléchargez et organisez vos justificatifs</CardDescription>
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
