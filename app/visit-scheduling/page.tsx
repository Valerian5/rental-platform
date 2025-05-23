import { CalendarScheduler } from "@/components/calendar-scheduler"
import { VisitSettings } from "@/components/visit-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VisitSchedulingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Système de Planification des Visites</h1>

      <Tabs defaultValue="calendar">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="requests">Demandes de visite</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des disponibilités</CardTitle>
              <CardDescription>Gérez vos disponibilités pour les visites de vos biens</CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarScheduler />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des visites</CardTitle>
              <CardDescription>Configurez vos préférences pour les visites</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de visite</CardTitle>
              <CardDescription>Gérez les demandes de visite reçues</CardDescription>
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
