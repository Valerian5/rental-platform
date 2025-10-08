"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Euro, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"

interface ChargeProvision {
  id: string
  provision_amount: number
  max_allowed_amount: number
  deposit_amount: number
  justification_notes: string
  provision_date: string
  expected_finalization_date: string
  status: 'active' | 'finalized' | 'refunded'
  finalization_date?: string
  final_balance?: number
  refund_amount?: number
  regularization?: any
}

interface Props {
  leaseId: string
  depositAmount: number
  onProvisionCreated?: () => void
  onProvisionFinalized?: () => void
}

export function ChargeProvisionManager({ leaseId, depositAmount, onProvisionCreated, onProvisionFinalized }: Props) {
  const [provisions, setProvisions] = useState<ChargeProvision[]>([])
  const [loading, setLoading] = useState(false)
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [selectedProvision, setSelectedProvision] = useState<ChargeProvision | null>(null)
  const [finalizeData, setFinalizeData] = useState({
    finalBalance: 0,
    refundAmount: 0,
    finalizationDate: new Date().toISOString().split('T')[0]
  })

  const maxProvisionalAmount = depositAmount * 0.2

  useEffect(() => {
    loadProvisions()
  }, [leaseId])

  const loadProvisions = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      
      const res = await fetch(`/api/leases/${leaseId}/charge-provisions`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      
      if (res.ok) {
        const { provisions } = await res.json()
        setProvisions(provisions || [])
      }
    } catch (error) {
      console.warn("Erreur chargement provisions:", error)
    }
  }

  const finalizeProvision = async () => {
    if (!selectedProvision) return

    setLoading(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      
      const res = await fetch(`/api/leases/${leaseId}/charge-provisions/finalize`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          finalBalance: finalizeData.finalBalance,
          refundAmount: finalizeData.refundAmount,
          finalizationDate: finalizeData.finalizationDate
        })
      })
      
      if (res.ok) {
        toast.success("Provision finalisée avec succès")
        setFinalizeDialogOpen(false)
        setSelectedProvision(null)
        loadProvisions()
        onProvisionFinalized?.()
      } else {
        const error = await res.json()
        toast.error(error.error || "Erreur finalisation")
      }
    } catch (error) {
      toast.error("Erreur finalisation")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (provision: ChargeProvision) => {
    switch (provision.status) {
      case 'active':
        const expectedDate = new Date(provision.expected_finalization_date)
        const today = new Date()
        const daysUntilDeadline = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDeadline < 0) {
          return <Badge variant="destructive">En retard</Badge>
        } else if (daysUntilDeadline <= 7) {
          return <Badge variant="secondary">Urgent</Badge>
        } else {
          return <Badge variant="outline">Active</Badge>
        }
      case 'finalized':
        return <Badge variant="default">Finalisée</Badge>
      case 'refunded':
        return <Badge variant="secondary">Remboursée</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const activeProvision = provisions.find(p => p.status === 'active')

  return (
    <div className="space-y-4">
      {/* Provision active */}
      {activeProvision && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Provision de charges active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Montant provision</Label>
                <div className="text-lg font-semibold">{activeProvision.provision_amount.toFixed(2)}€</div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Date prévue finalisation</Label>
                <div className="text-sm">{new Date(activeProvision.expected_finalization_date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Statut</Label>
                <div>{getStatusBadge(activeProvision)}</div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Justification</Label>
              <div className="text-sm text-gray-700">{activeProvision.justification_notes}</div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedProvision(activeProvision)
                  setFinalizeData({
                    finalBalance: 0,
                    refundAmount: activeProvision.provision_amount,
                    finalizationDate: new Date().toISOString().split('T')[0]
                  })
                  setFinalizeDialogOpen(true)
                }}
              >
                Finaliser la provision
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des provisions */}
      {provisions.filter(p => p.status !== 'active').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Historique des provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {provisions.filter(p => p.status !== 'active').map((provision) => (
                <div key={provision.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{provision.provision_amount.toFixed(2)}€</div>
                      <div className="text-sm text-gray-600">
                        Finalisée le {provision.finalization_date ? new Date(provision.finalization_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(provision)}
                      {provision.refund_amount && provision.refund_amount > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          Remboursé: {provision.refund_amount.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de finalisation */}
      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finaliser la provision de charges</DialogTitle>
            <DialogDescription>
              Saisissez les informations de la régularisation définitive.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Solde final des charges (€)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={finalizeData.finalBalance}
                onChange={(e) => {
                  const balance = parseFloat(e.target.value) || 0
                  const refund = Math.max(0, (selectedProvision?.provision_amount || 0) - balance)
                  setFinalizeData(prev => ({ 
                    ...prev, 
                    finalBalance: balance,
                    refundAmount: refund
                  }))
                }}
              />
            </div>
            
            <div>
              <Label>Montant à rembourser (€)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={finalizeData.refundAmount}
                onChange={(e) => setFinalizeData(prev => ({ 
                  ...prev, 
                  refundAmount: parseFloat(e.target.value) || 0 
                }))}
              />
              <div className="text-xs text-gray-600 mt-1">
                Calculé automatiquement: Provision - Solde final
              </div>
            </div>
            
            <div>
              <Label>Date de finalisation</Label>
              <Input 
                type="date"
                value={finalizeData.finalizationDate}
                onChange={(e) => setFinalizeData(prev => ({ 
                  ...prev, 
                  finalizationDate: e.target.value 
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={finalizeProvision} disabled={loading}>
              {loading ? "Finalisation..." : "Finaliser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
