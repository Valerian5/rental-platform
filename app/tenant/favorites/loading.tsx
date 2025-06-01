export default function TenantFavoritesLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-200 animate-pulse"></div>
            <div className="p-4">
              <div className="h-5 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
              <div className="flex gap-4 mb-3">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
