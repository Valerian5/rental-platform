"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, RefreshCw } from "lucide-react"
import { paymentService } from "@/lib/payment-service"
import { LeasePaymentConfig } from "@/lib/payment-models"
import { toast } from "sonner"

interface PaymentConfigProps {
  leaseId: string
  onConfigUpdated?: () => void
}

export function PaymentConfig({ leaseId, onConfigUpdated }: PaymentConfigProps) {
  const [config, setConfig] = useState<LeasePaymentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [leaseId])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const data = await paymentService.getLeasePaymentConfig(leaseId)
      setConfig(data)
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration:", error)
      // Configuration par défaut si aucune n'existe
      setConfig({
        lease_id: leaseId,
        property_id: "",
        tenant_id: "",
        monthly_rent: 0,
        monthly_charges: 0,
        payment_day: 5,
        payment_method: "virement",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setIsSaving(true)
      await paymentService.updateLeasePaymentConfig(leaseId, config)
      toast.success("Configuration sauvegardée avec succès")
      onConfigUpdated?.()
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfigChange = (field: keyof LeasePaymentConfig, value: any) => {
    if (!config) return
    setConfig(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Impossible de charger la configuration</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration des paiements</CardTitle>
        <CardDescription>
          Configurez les paramètres de paiement pour ce bail
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="monthly_rent">Loyer mensuel (€)</Label>
            <Input
              id="monthly_rent"
              type="number"
              value={config.monthly_rent}
              onChange={(e) => handleConfigChange('monthly_rent', parseInt(e.target.value) || 0)}
              placeholder="800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_charges">Charges mensuelles (€)</Label>
            <Input
              id="monthly_charges"
              type="number"
              value={config.monthly_charges}
              onChange={(e) => handleConfigChange('monthly_charges', parseInt(e.target.value) || 0)}
              placeholder="75"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_day">Jour de paiement</Label>
            <Select
              value={config.payment_day.toString()}
              onValueChange={(value) => handleConfigChange('payment_day', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    Le {day} du mois
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Mode de paiement</Label>
            <Select
              value={config.payment_method}
              onValueChange={(value) => handleConfigChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement bancaire</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="prelevement">Prélèvement automatique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={config.is_active}
            onCheckedChange={(checked) => handleConfigChange('is_active', checked)}
          />
          <Label htmlFor="is_active">Activer la gestion automatique des paiements</Label>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Résumé de la configuration</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Montant total mensuel:</strong> {(config.monthly_rent + config.monthly_charges).toLocaleString()} €</p>
            <p><strong>Échéance:</strong> Le {config.payment_day} de chaque mois</p>
            <p><strong>Mode de paiement:</strong> {
              config.payment_method === 'virement' ? 'Virement bancaire' :
              config.payment_method === 'cheque' ? 'Chèque' :
              config.payment_method === 'especes' ? 'Espèces' :
              'Prélèvement automatique'
            }</p>
            <p><strong>Statut:</strong> {config.is_active ? 'Actif' : 'Inactif'}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
