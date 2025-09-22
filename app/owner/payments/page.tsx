"use client"

import { useState, useEffect } from "react"
import { PaymentManagement } from "@/components/PaymentManagement"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { paymentService } from "@/lib/payment-service"
import { toast } from "sonner"

export default function PaymentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") return
        setCurrentUser(user)
      } catch (error) {
        console.error("Erreur initialisation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()
  }, [])

  const handleGenerateMonthlyPayments = async () => {
    try {
      await paymentService.generateMonthlyPayments()
      toast.success("Paiements mensuels générés avec succès")
    } catch (error) {
      toast.error("Erreur lors de la génération des paiements")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
        <p className="text-gray-600">Vous devez être connecté en tant que propriétaire.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestion des Paiements" 
        description="Gérez les paiements mensuels et générez les quittances automatiquement"
      >
        <Button onClick={handleGenerateMonthlyPayments}>
          <Plus className="h-4 w-4 mr-2" />
          Générer paiements mensuels
        </Button>
      </PageHeader>

      <PaymentManagement ownerId={currentUser.id} />
    </div>
  )
}
