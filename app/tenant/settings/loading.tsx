export default function TenantSettingsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        <div className="space-y-6">
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>

          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between items-center">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
