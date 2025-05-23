import { PropertyForm } from "@/components/property-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewPropertyPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ajouter un nouveau bien</h1>
        <p className="text-muted-foreground">Créez une annonce pour votre bien immobilier</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du bien</CardTitle>
          <CardDescription>Remplissez tous les détails de votre bien pour créer une annonce attractive</CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyForm />
        </CardContent>
      </Card>
    </div>
  )
}
