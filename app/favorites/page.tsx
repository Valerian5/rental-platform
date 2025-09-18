"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FavoritesList } from "@/components/favorites-list"
import { PageHeader } from "@/components/page-header"
import { authService } from "@/lib/auth-service"
import { Skeleton } from "@/components/ui/skeleton"

export default function FavoritesPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user) {
          router.push("/login")
          return
        }
        setCurrentUser(user)
      } catch (error) {
        console.error("Erreur d'authentification:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="flex space-x-4">
                  <Skeleton className="h-32 w-32" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Mes favoris"
        description="Retrouvez tous les biens que vous avez ajoutés à vos favoris"
      />
      
      <div className="mt-8">
        <FavoritesList 
          userId={currentUser.id}
          onRemove={(propertyId) => {
            // Optionnel : ajouter une logique de callback
            console.log("Propriété retirée des favoris:", propertyId)
          }}
        />
      </div>
    </div>
  )
}
