"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Euro, Calendar, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { ReceiptServiceClient } from "@/lib/receipt-service-client"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Receipt {
  id: string
  receipt_id?: string
  month: string
  year: number
  amount: number
  charges: number
  status: string
  due_date: string
  paid_date?: string
  created_at: string
  file_url?: string
}

export default function TenantPaymentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          window.location.href = "/login"
          return
        }

        setCurrentUser(user)
        await loadReceipts()
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadReceipts = async () => {
    try {
      // Récupérer les quittances via l'API avec token Bearer
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch("/api/receipts/tenant", { 
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()

      if (data.success) {
        setReceipts(data.receipts || [])
      } else {
        console.error("❌ Erreur récupération quittances:", data.error)
        toast.error("Erreur lors du chargement des quittances")
      }
    } catch (error) {
      console.error("❌ Erreur fetch quittances:", error)
      toast.error("Erreur lors du chargement des quittances")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Payé</Badge>
      case "overdue":
        return <Badge variant="destructive">En retard</Badge>
      case "pending":
        return <Badge className="bg-orange-600">En attente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "overdue":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const handleDownload = async (receipt: Receipt) => {
    try {
      if (!receipt.file_url) return
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch(receipt.file_url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Erreur lors du téléchargement')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quittance_${receipt.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('❌ Erreur téléchargement quittance:', error)
      toast.error("Erreur lors du téléchargement de la quittance")
    }
  }

  const overdueReceipts = receipts.filter((r) => r.status === "overdue")
  const totalOverdue = overdueReceipts.reduce((sum, r) => sum + r.amount + r.charges, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de vos paiements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alertes */}
      {overdueReceipts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Attention :</strong> Vous avez {overdueReceipts.length} paiement{overdueReceipts.length > 1 ? 's' : ''} en retard 
            pour un montant total de {totalOverdue}€.
          </AlertDescription>
        </Alert>
      )}

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total payé</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receipts.filter(r => r.status === "paid").reduce((sum, r) => sum + r.amount + r.charges, 0)}€
            </div>
            <p className="text-xs text-muted-foreground">
              {receipts.filter(r => r.status === "paid").length} paiement{receipts.filter(r => r.status === "paid").length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueReceipts.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalOverdue}€ à régulariser
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain paiement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receipts.filter(r => r.status === "pending").length > 0 
                ? `${receipts.filter(r => r.status === "pending")[0]?.amount + receipts.filter(r => r.status === "pending")[0]?.charges}€`
                : "Aucun"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {receipts.filter(r => r.status === "pending").length > 0 
                ? `Échéance le ${new Date(receipts.filter(r => r.status === "pending")[0]?.due_date).toLocaleDateString("fr-FR")}`
                : "Aucun paiement en attente"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun paiement</h3>
              <p className="text-muted-foreground">Aucun paiement enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receipts
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(receipt.status)}
                    <div>
                      <h3 className="font-medium">
                        Loyer {receipt.month} {receipt.year}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {receipt.amount}€ + {receipt.charges}€ de charges = {receipt.amount + receipt.charges}€
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Échéance : {new Date(receipt.due_date).toLocaleDateString("fr-FR")}
                        {receipt.paid_date && (
                          <span> • Payé le {new Date(receipt.paid_date).toLocaleDateString("fr-FR")}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(receipt.status)}
                    {receipt.status === "paid" && receipt.file_url && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(receipt)}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
