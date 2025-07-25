"use client"

import { useState, useEffect } from "react"
import { DocumentValidationWorkflow } from "@/components/document-validation-workflow"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function DocumentValidationPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        toast.error("Vous devez être connecté")
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error("Erreur chargement utilisateur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleValidationComplete = (results: any[]) => {
    console.log("Validation terminée:", results)
    toast.success("Tous les documents ont été validés avec succès!")

    // Rediriger vers le tableau de bord ou la page suivante
    // router.push('/tenant/dashboard')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <DocumentValidationWorkflow tenantId={user.id} onComplete={handleValidationComplete} />
    </div>
  )
}
