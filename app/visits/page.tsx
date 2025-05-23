import { VisitRequests } from "@/components/visits/visit-requests"
import { UpcomingVisits } from "@/components/visits/upcoming-visits"
import { VisitHistory } from "@/components/visits/visit-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function VisitsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Visites</h1>
        <p className="text-muted-foreground">Gérez les propositions de visite et vos rendez-vous</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Propositions à traiter</TabsTrigger>
          <TabsTrigger value="upcoming">Visites à venir</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Propositions de visite</CardTitle>
              <CardDescription>Choisissez un créneau parmi ceux proposés par les propriétaires</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitRequests />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Visites programmées</CardTitle>
              <CardDescription>Vos prochaines visites confirmées</CardDescription>
            </CardHeader>
            <CardContent>
              <UpcomingVisits />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des visites</CardTitle>
              <CardDescription>Vos visites passées</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
