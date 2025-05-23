import { TenantVisitCalendar } from "@/components/tenant-visit-calendar"
import { VisitRequests } from "@/components/visit-requests"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TenantVisitsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Visites</h1>
        <p className="text-muted-foreground">Planifiez et suivez vos visites de biens immobiliers</p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendrier des visites</TabsTrigger>
          <TabsTrigger value="requests">Demandes de visite</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des visites</CardTitle>
              <CardDescription>Visualisez toutes vos visites programmées</CardDescription>
            </CardHeader>
            <CardContent>
              <TenantVisitCalendar />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de visite</CardTitle>
              <CardDescription>Gérez vos demandes de visite en attente</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitRequests />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
