import { PropertySearch } from "@/components/property-search"
import { PropertyList } from "@/components/property-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PropertySearchPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recherche de biens</h1>
        <p className="text-muted-foreground">Trouvez le logement qui correspond à vos critères</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search filters */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Filtres de recherche</CardTitle>
              <CardDescription>Affinez votre recherche</CardDescription>
            </CardHeader>
            <CardContent>
              <PropertySearch />
            </CardContent>
          </Card>
        </div>

        {/* Property results */}
        <div className="lg:col-span-3">
          <PropertyList />
        </div>
      </div>
    </div>
  )
}
