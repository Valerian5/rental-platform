import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Calculator, FileText, AlertCircle, Euro, Calendar, BarChart3 } from "lucide-react"

async function getRevisionData() {
  const supabase = createClient()

  // Récupérer les révisions de loyer
  const { data: revisions } = await supabase
    .from("rent_revisions")
    .select(`
      *,
      lease:leases(
        property:properties(title, address),
        tenant:users!leases_tenant_id_fkey(first_name, last_name)
      )
    `)
    .order("revision_date", { ascending: false })

  // Statistiques des révisions
  const stats = {
    total: revisions?.length || 0,
    applied: revisions?.filter((r) => r.status === "applied").length || 0,
    pending: revisions?.filter((r) => r.status === "pending").length || 0,
    totalIncrease: revisions?.reduce((sum, r) => sum + (r.new_rent - r.current_rent), 0) || 0,
  }

  return { revisions: revisions || [], stats }
}

function RevisionCard({ revision }: { revision: any }) {
  const increase = revision.new_rent - revision.current_rent
  const percentage = revision.revision_percentage

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{revision.lease?.property?.title}</CardTitle>
            <CardDescription>{revision.lease?.property?.address}</CardDescription>
          </div>
          <Badge variant={revision.status === "applied" ? "default" : "secondary"}>
            {revision.status === "applied" ? "Appliquée" : "En attente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Locataire</p>
            <p className="font-medium">
              {revision.lease?.tenant?.first_name} {revision.lease?.tenant?.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date de révision</p>
            <p className="font-medium">{new Date(revision.revision_date).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Loyer actuel</p>
            <p className="text-lg font-bold">{revision.current_rent}€</p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-sm text-muted-foreground">Augmentation</p>
            <p className="text-lg font-bold text-green-600">+{increase.toFixed(2)}€</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Nouveau loyer</p>
            <p className="text-lg font-bold text-blue-600">{revision.new_rent}€</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Indice de référence</p>
            <p className="font-medium">{revision.insee_index_reference}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Indice actuel</p>
            <p className="font-medium">{revision.insee_index_current}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Révision: +{percentage.toFixed(2)}%</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Courrier
            </Button>
            {revision.status === "pending" && <Button size="sm">Appliquer</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NewRevisionCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Calculer une révision</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Utilisez l'indice INSEE pour calculer automatiquement la révision de loyer
        </p>
        <Button>
          <Calculator className="h-4 w-4 mr-2" />
          Nouvelle révision
        </Button>
      </CardContent>
    </Card>
  )
}

export default async function RevisionPage() {
  const { revisions, stats } = await getRevisionData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Révision des loyers</h1>
        <p className="text-muted-foreground">Gérez les révisions annuelles de vos loyers selon l'indice INSEE</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total révisions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.applied}</p>
                <p className="text-sm text-muted-foreground">Appliquées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">+{stats.totalIncrease.toFixed(0)}€</p>
                <p className="text-sm text-muted-foreground">Augmentation totale</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes les révisions</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="applied">Appliquées</TabsTrigger>
          <TabsTrigger value="calculator">Calculateur</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {revisions.map((revision) => (
              <RevisionCard key={revision.id} revision={revision} />
            ))}
            {revisions.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune révision</h3>
                  <p className="text-muted-foreground">Commencez par calculer une révision de loyer</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {revisions
              .filter((r) => r.status === "pending")
              .map((revision) => (
                <RevisionCard key={revision.id} revision={revision} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          <div className="grid gap-4">
            {revisions
              .filter((r) => r.status === "applied")
              .map((revision) => (
                <RevisionCard key={revision.id} revision={revision} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <NewRevisionCard />

          <Card>
            <CardHeader>
              <CardTitle>Guide de révision</CardTitle>
              <CardDescription>Informations importantes sur la révision des loyers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📅 Quand réviser ?</h4>
                  <p className="text-sm text-blue-800">
                    La révision peut être effectuée une fois par an, à la date anniversaire du bail.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">📊 Indice de référence</h4>
                  <p className="text-sm text-green-800">
                    Utilisez l'Indice de Référence des Loyers (IRL) publié par l'INSEE chaque trimestre.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">📝 Procédure</h4>
                  <p className="text-sm text-orange-800">
                    Envoyez un courrier recommandé au locataire avec le calcul détaillé de la révision.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
