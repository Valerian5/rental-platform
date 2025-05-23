import { VisitDetail } from "@/components/visits/visit-detail"
import { VisitTimeline } from "@/components/visits/visit-timeline"
import { VisitActions } from "@/components/visits/visit-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VisitDetailPage({ params }: { params: { id: string } }) {
  // Dans une application réelle, vous récupéreriez les détails de la visite à partir de l'API
  // en utilisant l'ID fourni dans params.id

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Détails de la visite</h1>
        <p className="text-muted-foreground">Suivi et gestion de la visite</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de la visite</CardTitle>
              <CardDescription>Détails du rendez-vous et du candidat</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitDetail visitId={params.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>Suivi chronologique de la visite</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitTimeline visitId={params.id} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Gérer cette visite</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitActions visitId={params.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
