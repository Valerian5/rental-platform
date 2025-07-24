export default function AgencyPropertiesLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-32 mt-2 animate-pulse"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
      </div>

      <div className="grid gap-6">
        {/* Filtres skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 bg-muted rounded w-24 mb-4 animate-pulse"></div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-80 animate-pulse"></div>
          </div>
        </div>

        {/* Statistiques skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-muted rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Liste des propriétés skeleton */}
        <div className="border rounded-lg">
          <div className="p-6 border-b">
            <div className="h-6 bg-muted rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                      <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                      <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-80 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
