"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Save, Send } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface LeaseFormData {
  // Property selection
  propertyId: string

  // Tenant information
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  tenantAddress: string

  // Lease terms
  startDate: Date | undefined
  endDate: Date | undefined
  monthlyRent: string
  charges: string
  deposit: string
  noticePeriod: string
  renewalType: "automatic" | "manual"

  // Additional terms
  furnished: boolean
  petsAllowed: boolean
  smokingAllowed: boolean
  sublettingAllowed: boolean

  // Special clauses
  specialClauses: string

  // Documents
  includeInventory: boolean
  includeInsurance: boolean
  includeGuarantee: boolean
}

const initialFormData: LeaseFormData = {
  propertyId: "",
  tenantName: "",
  tenantEmail: "",
  tenantPhone: "",
  tenantAddress: "",
  startDate: undefined,
  endDate: undefined,
  monthlyRent: "",
  charges: "",
  deposit: "",
  noticePeriod: "3",
  renewalType: "automatic",
  furnished: false,
  petsAllowed: false,
  smokingAllowed: false,
  sublettingAllowed: false,
  specialClauses: "",
  includeInventory: true,
  includeInsurance: true,
  includeGuarantee: false,
}

// Mock properties data
const mockProperties = [
  { id: "1", address: "123 Rue de la Paix, 75001 Paris", type: "Appartement" },
  { id: "2", address: "456 Avenue des Champs, 75008 Paris", type: "Studio" },
  { id: "3", address: "789 Boulevard Saint-Germain, 75006 Paris", type: "Maison" },
]

export function LeaseForm() {
  const [formData, setFormData] = useState<LeaseFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof LeaseFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (action: "save" | "send") => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Form submitted:", { action, data: formData })
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Property & Tenant Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
            <CardDescription>Sélectionnez le bien et renseignez les informations du locataire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Bien à louer *</Label>
              <Select value={formData.propertyId} onValueChange={(value) => handleInputChange("propertyId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un bien" />
                </SelectTrigger>
                <SelectContent>
                  {mockProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} ({property.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Informations du locataire</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Nom complet *</Label>
                  <Input
                    id="tenantName"
                    value={formData.tenantName}
                    onChange={(e) => handleInputChange("tenantName", e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantEmail">Email *</Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    value={formData.tenantEmail}
                    onChange={(e) => handleInputChange("tenantEmail", e.target.value)}
                    placeholder="jean.dupont@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantPhone">Téléphone</Label>
                <Input
                  id="tenantPhone"
                  value={formData.tenantPhone}
                  onChange={(e) => handleInputChange("tenantPhone", e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantAddress">Adresse actuelle</Label>
                <Textarea
                  id="tenantAddress"
                  value={formData.tenantAddress}
                  onChange={(e) => handleInputChange("tenantAddress", e.target.value)}
                  placeholder="Adresse complète du locataire"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lease Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions du Bail</CardTitle>
            <CardDescription>Définissez les termes financiers et la durée du bail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "dd MMMM yyyy", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => handleInputChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Date de fin *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "dd MMMM yyyy", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => handleInputChange("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Loyer mensuel (€) *</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                  placeholder="1200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="charges">Charges (€)</Label>
                <Input
                  id="charges"
                  type="number"
                  value={formData.charges}
                  onChange={(e) => handleInputChange("charges", e.target.value)}
                  placeholder="150"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit">Dépôt de garantie (€) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => handleInputChange("deposit", e.target.value)}
                  placeholder="2400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noticePeriod">Préavis (mois)</Label>
                <Select
                  value={formData.noticePeriod}
                  onValueChange={(value) => handleInputChange("noticePeriod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mois</SelectItem>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de renouvellement</Label>
              <Select
                value={formData.renewalType}
                onValueChange={(value: "automatic" | "manual") => handleInputChange("renewalType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Renouvellement automatique</SelectItem>
                  <SelectItem value="manual">Renouvellement manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions Particulières</CardTitle>
          <CardDescription>Définissez les règles spécifiques du bail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="furnished"
                checked={formData.furnished}
                onCheckedChange={(checked) => handleInputChange("furnished", checked)}
              />
              <Label htmlFor="furnished">Meublé</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="petsAllowed"
                checked={formData.petsAllowed}
                onCheckedChange={(checked) => handleInputChange("petsAllowed", checked)}
              />
              <Label htmlFor="petsAllowed">Animaux autorisés</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="smokingAllowed"
                checked={formData.smokingAllowed}
                onCheckedChange={(checked) => handleInputChange("smokingAllowed", checked)}
              />
              <Label htmlFor="smokingAllowed">Fumeur autorisé</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sublettingAllowed"
                checked={formData.sublettingAllowed}
                onCheckedChange={(checked) => handleInputChange("sublettingAllowed", checked)}
              />
              <Label htmlFor="sublettingAllowed">Sous-location</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialClauses">Clauses particulières</Label>
            <Textarea
              id="specialClauses"
              value={formData.specialClauses}
              onChange={(e) => handleInputChange("specialClauses", e.target.value)}
              placeholder="Ajoutez des clauses spécifiques au bail..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents Associés</CardTitle>
          <CardDescription>Sélectionnez les documents à inclure avec le bail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeInventory"
                checked={formData.includeInventory}
                onCheckedChange={(checked) => handleInputChange("includeInventory", checked)}
              />
              <Label htmlFor="includeInventory">État des lieux</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeInsurance"
                checked={formData.includeInsurance}
                onCheckedChange={(checked) => handleInputChange("includeInsurance", checked)}
              />
              <Label htmlFor="includeInsurance">Attestation d'assurance</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeGuarantee"
                checked={formData.includeGuarantee}
                onCheckedChange={(checked) => handleInputChange("includeGuarantee", checked)}
              />
              <Label htmlFor="includeGuarantee">Acte de caution</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => handleSubmit("save")} disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder brouillon
        </Button>

        <Button onClick={() => handleSubmit("send")} disabled={isSubmitting}>
          <Send className="h-4 w-4 mr-2" />
          Envoyer pour signature
        </Button>
      </div>
    </div>
  )
}
