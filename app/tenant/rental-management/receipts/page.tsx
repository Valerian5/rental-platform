"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Receipt, Download, Search, Filter, Calendar, Euro, FileText } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

interface Receipt {
  id: string
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

export default function TenantReceiptsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")

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
      const res = await fetch("/api/receipts/tenant", { cache: 'no-store' })
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

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch = receipt.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.year.toString().includes(searchTerm)
    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter
    const matchesYear = yearFilter === "all" || receipt.year.toString() === yearFilter

    return matchesSearch && matchesStatus && matchesYear
  })

  const availableYears = [...new Set(receipts.map(r => r.year))].sort((a, b) => b - a)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement de vos quittances...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes quittances</h2>
          <p className="text-muted-foreground">
            Consultez et téléchargez vos quittances de loyer ({filteredReceipts.length} quittance{filteredReceipts.length > 1 ? 's' : ''})
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par mois ou année..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des quittances */}
      {filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune quittance</h3>
            <p className="text-muted-foreground mb-4">
              {receipts.length === 0 
                ? "Aucune quittance générée pour le moment."
                : "Aucune quittance ne correspond à vos critères de recherche."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReceipts
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((receipt) => (
            <Card key={receipt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Receipt className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Quittance de loyer - {receipt.month} {receipt.year}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          <span>{receipt.amount}€ + {receipt.charges}€ = {receipt.amount + receipt.charges}€</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Échéance : {new Date(receipt.due_date).toLocaleDateString("fr-FR")}</span>
                        </div>
                        {receipt.paid_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Payé le : {new Date(receipt.paid_date).toLocaleDateString("fr-FR")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(receipt.status)}
                    {receipt.status === "paid" && receipt.file_url && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={receipt.file_url} target="_blank">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
