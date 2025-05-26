"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface LeaseFormProps {
  propertyId?: string
  tenantId?: string
  onSubmit?: (data: any) => void
}

export function LeaseForm({ propertyId, tenantId, onSubmit }: LeaseFormProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [formData, setFormData] = useState({
    propertyId: propertyId || "",
    tenantId: tenantId || "",
    monthlyRent: "",
    securityDeposit: "",
    charges: "",
    duration: "12",
    renewalType: "automatic",
    specialConditions: "",
    documents: [] as File[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const leaseData = {
      ...formData,
      startDate,
      endDate,
      monthlyRent: Number(formData.monthlyRent),
      securityDeposit: Number(formData.securityDeposit),
      charges: Number(formData.charges),
    }
    onSubmit?.(leaseData)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...files],
    }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Nouveau contrat de bail</CardTitle>
        <CardDescription>Créez un nouveau contrat de location pour votre propriété</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property">Propriété</Label>
              <Select
                value={formData.propertyId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, propertyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une propriété" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prop1">Appartement 3P - 15 rue de la Paix</SelectItem>
                  <SelectItem value="prop2">Studio - 8 avenue Victor Hugo</SelectItem>
                  <SelectItem value="prop3">Maison 4P - 22 rue des Lilas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant">Locataire</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, tenantId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un locataire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant1">Marie Dupont</SelectItem>
                  <SelectItem value="tenant2">Jean Martin</SelectItem>
                  <SelectItem value="tenant3">Sophie Bernard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => !startDate || date <= startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Informations financières */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Loyer mensuel (€)</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData((prev) => ({ ...prev, monthlyRent: e.target.value }))}
                placeholder="1200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityDeposit">Dépôt de garantie (€)</Label>
              <Input
                id="securityDeposit"
                type="number"
                value={formData.securityDeposit}
                onChange={(e) => setFormData((prev) => ({ ...prev, securityDeposit: e.target.value }))}
                placeholder="1200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="charges">Charges (€)</Label>
              <Input
                id="charges"
                type="number"
                value={formData.charges}
                onChange={(e) => setFormData((prev) => ({ ...prev, charges: e.target.value }))}
                placeholder="150"
              />
            </div>
          </div>

          {/* Durée et renouvellement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durée (mois)</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 mois</SelectItem>
                  <SelectItem value="12">12 mois</SelectItem>
                  <SelectItem value="24">24 mois</SelectItem>
                  <SelectItem value="36">36 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewalType">Type de renouvellement</Label>
              <Select
                value={formData.renewalType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, renewalType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatique</SelectItem>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditions spéciales */}
          <div className="space-y-2">
            <Label htmlFor="specialConditions">Conditions spéciales</Label>
            <Textarea
              id="specialConditions"
              value={formData.specialConditions}
              onChange={(e) => setFormData((prev) => ({ ...prev, specialConditions: e.target.value }))}
              placeholder="Ajoutez des conditions spéciales au contrat..."
              rows={4}
            />
          </div>

          {/* Upload de documents */}
          <div className="space-y-2">
            <Label htmlFor="documents">Documents annexes</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Cliquez pour télécharger des documents
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">PDF, DOC, DOCX jusqu'à 10MB</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            {formData.documents.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">{formData.documents.length} document(s) sélectionné(s)</p>
                <ul className="text-xs text-gray-500">
                  {formData.documents.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Créer le contrat
            </Button>
            <Button type="button" variant="outline" className="flex-1">
              Sauvegarder en brouillon
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
