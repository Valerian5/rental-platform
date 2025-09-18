import { useState, useEffect } from "react"

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        setFavorites(new Set())
        return
      }

      const { apiRequest } = await import("@/lib/api-client")
      const data = await apiRequest("/api/favorites")
      const favoriteIds = new Set(data.data.map((f: any) => f.property_id))
      setFavorites(favoriteIds)
    } catch (error) {
      console.error("Erreur chargement favoris:", error)
      setFavorites(new Set())
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async (propertyId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        throw new Error("Vous devez être connecté pour ajouter des favoris")
      }

      const { apiRequest } = await import("@/lib/api-client")
      const data = await apiRequest("/api/favorites/toggle", {
        method: "POST",
        body: JSON.stringify({
          property_id: propertyId,
        }),
      })

      const newFavorites = new Set(favorites)
      if (data.isFavorite) {
        newFavorites.add(propertyId)
      } else {
        newFavorites.delete(propertyId)
      }
      setFavorites(newFavorites)

      return data.isFavorite
    } catch (error) {
      console.error("Erreur toggle favori:", error)
      throw error
    }
  }

  const isFavorite = (propertyId: string) => {
    return favorites.has(propertyId)
  }

  // Charger les favoris au montage du composant
  useEffect(() => {
    loadFavorites()
  }, [])

  return {
    favorites,
    isLoading,
    loadFavorites,
    toggleFavorite,
    isFavorite,
  }
}
