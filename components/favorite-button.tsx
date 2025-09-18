"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface FavoriteButtonProps {
  propertyId: string
  userId?: string
  initialIsFavorite?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  className?: string
  onToggle?: (isFavorite: boolean) => void
}

export function FavoriteButton({
  propertyId,
  userId,
  initialIsFavorite = false,
  size = "md",
  variant = "ghost",
  className = "",
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)

  // Vérifier le statut initial des favoris
  useEffect(() => {
    if (userId && propertyId) {
      checkFavoriteStatus()
    }
  }, [userId, propertyId])

  const checkFavoriteStatus = async () => {
    try {
      const { apiRequest } = await import("@/lib/api-client")
      const data = await apiRequest(`/api/favorites/check?property_id=${propertyId}`)
      setIsFavorite(data.isFavorite)
    } catch (error) {
      console.error("Erreur lors de la vérification des favoris:", error)
    }
  }

  const handleToggle = async () => {
    if (!userId) {
      toast.error("Vous devez être connecté pour ajouter aux favoris")
      return
    }

    setIsLoading(true)
    try {
      const { apiRequest } = await import("@/lib/api-client")
      const data = await apiRequest("/api/favorites/toggle", {
        method: "POST",
        body: JSON.stringify({ property_id: propertyId }),
      })

      setIsFavorite(data.isFavorite)
      onToggle?.(data.isFavorite)
      
      toast.success(
        data.isFavorite 
          ? "Ajouté aux favoris" 
          : "Retiré des favoris"
      )
    } catch (error) {
      console.error("Erreur lors du toggle des favoris:", error)
      toast.error("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 w-8"
      case "lg":
        return "h-12 w-12"
      default:
        return "h-10 w-10"
    }
  }

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4"
      case "lg":
        return "h-6 w-6"
      default:
        return "h-5 w-5"
    }
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      disabled={isLoading || !userId}
      className={`${getSizeClasses()} ${className} ${
        isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-600 hover:text-red-500"
      }`}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isLoading ? (
        <Loader2 className={`${getIconSize()} animate-spin`} />
      ) : (
        <Heart 
          className={`${getIconSize()} ${
            isFavorite ? "fill-current" : ""
          }`} 
        />
      )}
    </Button>
  )
}
