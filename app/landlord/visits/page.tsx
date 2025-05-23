import { VisitManagement } from "@/components/visits/visit-management"
import { VisitCalendar } from "@/components/visits/visit-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

export default function LandlordVisitsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion des Visites</h1>
            <p className="text-muted-foreground">Proposez et gérez les visites de vos biens</p>
          </div>
          <Link href="/landlord/visits/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Proposer une visite
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="management">Gestion des visites</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les visites</CardTitle>
              <CardDescription>Gérez les propositions, confirmations et visites passées</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des visites</CardTitle>
              <CardDescription>Vue d'ensemble de toutes vos visites programmées</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitCalendar />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
