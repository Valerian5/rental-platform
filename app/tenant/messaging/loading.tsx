export default function TenantMessagingLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Liste des conversations */}
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-3">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-3 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de conversation */}
        <div className="lg:col-span-2 border rounded-lg">
          <div className="p-4 border-b">
            <div className="flex gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] p-3 rounded-lg ${i % 2 === 0 ? "bg-gray-100" : "bg-blue-100"}`}>
                  <div className="h-4 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
