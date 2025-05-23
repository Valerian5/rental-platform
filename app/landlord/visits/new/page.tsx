import { VisitRequestForm } from "@/components/visits/visit-request-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewVisitRequestPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Proposer une visite</h1>
        <p className="text-muted-foreground">Invitez des candidats à visiter votre bien</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de proposition de visite</CardTitle>
          <CardDescription>Proposez plusieurs créneaux pour que le candidat puisse choisir</CardDescription>
        </CardHeader>
        <CardContent>
          <VisitRequestForm />
        </CardContent>
      </Card>
    </div>
  )
}
