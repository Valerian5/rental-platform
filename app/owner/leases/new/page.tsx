"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Upload, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { supabase } from "@/lib/supabase"

export default function NewLeasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("application")

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [application, setApplication] = useState<any>(null)

  const [formData, setFormData] = useState({
    property_id: "",
    tenant_id: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    monthly_rent: "",
    charges: "",
    deposit: "",
    lease_type: "unfurnished",
    duration: "12",
    renewable: true,
    furnished_items: [] as string[],
    special_conditions: "",
    documents: [] as File[],
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [applicationId])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()

      if (!currentUser) {
        toast.error("Vous devez être connecté pour accéder à cette page")
        router.push("/login")
        return
      }

      if (currentUser.user_type !== "owner") {
        toast.error("Accès réservé aux propriétaires")
        router.push("/")
        return
      }

      setUser(currentUser)
      console.log("👤 Utilisateur connecté:", currentUser.id)

      // Charger les propriétés du propriétaire avec l'API correcte
      try {
        const propertiesResponse = await fetch(`/api/properties/owner?owner_id=${currentUser.id}`)
        console.log("🏠 Réponse propriétés:", propertiesResponse.status)

        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json()
          console.log("🏠 Propriétés chargées:", propertiesData.properties?.length || 0)
          setProperties(propertiesData.properties || [])
        } else {
          console.error("Erreur chargement propriétés:", propertiesResponse.status)
          toast.error("Erreur lors du chargement des propriétés")
        }
      } catch (error) {
        console.error("Erreur propriétés:", error)
        toast.error("Erreur lors du chargement des propriétés")
      }

      // Si un ID d'application est fourni, charger les détails
      if (applicationId) {
        try {
          console.log("📋 Chargement application:", applicationId)
          const applicationResponse = await fetch(`/api/applications/${applicationId}`)

          if (applicationResponse.ok) {
            const applicationData = await applicationResponse.json()
            console.log("📋 Application chargée:", applicationData.application?.id)
            setApplication(applicationData.application)

            // Pré-remplir le formulaire avec les données de l'application
            if (applicationData.application) {
              const app = applicationData.application
              setFormData((prev) => ({
                ...prev,
                property_id: app.property_id || "",
                tenant_id: app.tenant_id || "",
                monthly_rent: app.property?.price?.toString() || "",
                charges: app.property?.charges?.toString() || "0",
                deposit: (app.property?.price * 1).toString() || "",
              }))

              // Utiliser directement les données du tenant depuis l'application
              if (app.tenant) {
                console.log("👤 Locataire chargé depuis l'application:", app.tenant.email)
                setTenants([app.tenant])
              }
            }
          } else {
            console.error("Erreur chargement application:", applicationResponse.status)
            toast.error("Erreur lors du chargement de l'application")
          }
        } catch (error) {
          console.error("Erreur application:", error)
          toast.error("Erreur lors du chargement de l'application")
        }
      } else {
        // Charger la liste des locataires potentiels
        try {
          const tenantsResponse = await fetch(`/api/applications/tenant-owner?owner_id=${currentUser.id}`)
          if (tenantsResponse.ok) {
            const tenantsData = await tenantsResponse.json()
            console.log("👥 Locataires chargés:", tenantsData.tenants?.length || 0)
            setTenants(tenantsData.tenants || [])
          } else {
            console.error("Erreur chargement locataires:", tenantsResponse.status)
          }
        } catch (error) {
          console.error("Erreur locataires:", error)
        }
      }
    } catch (error) {
      console.error("Erreur initialisation:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }

      // Si on change de propriété, récupérer les charges
      if (name === "property_id") {
        const selectedProperty = properties.find((p) => p.id === value)
        if (selectedProperty) {
          newData.monthly_rent = selectedProperty.price?.toString() || ""
          newData.charges = selectedProperty.charges_amount?.toString() || selectedProperty.charges?.toString() || "0"
          newData.deposit = (selectedProperty.price * 1).toString() || ""
        }
      }

      // Recalculer la date de fin si on change le type de bail et qu'on a une date de début
      if (name === "lease_type" && prev.start_date) {
        const yearsToAdd = value === "furnished" ? 1 : 3
        const endDate = new Date(prev.start_date)
        endDate.setFullYear(endDate.getFullYear() + yearsToAdd)
        newData.end_date = endDate
      }

      return newData
    })
  }

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: date }

      // Auto-calculer la date de fin selon le type de bail
      if (name === "start_date" && date) {
        const yearsToAdd = prev.lease_type === "furnished" ? 1 : 3
        const endDate = new Date(date)
        endDate.setFullYear(endDate.getFullYear() + yearsToAdd)
        newData.end_date = endDate
      }

      return newData
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...files],
    }))
  }

  const handleFurnishedItemToggle = (item: string) => {
    setFormData((prev) => {
      const items = [...prev.furnished_items]
      if (items.includes(item)) {
        return { ...prev, furnished_items: items.filter((i) => i !== item) }
      } else {
        return { ...prev, furnished_items: [...items, item] }
      }
    })
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.property_id || !formData.tenant_id) {
        toast.error("Veuillez sélectionner un bien et un locataire")
        return
      }
    } else if (currentStep === 2) {
      if (!formData.start_date || !formData.end_date) {
        toast.error("Veuillez définir les dates du bail")
        return
      }
      if (!formData.monthly_rent) {
        toast.error("Veuillez définir le montant du loyer")
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      console.log("💾 Début sauvegarde bail")

      if (
        !formData.property_id ||
        !formData.tenant_id ||
        !formData.start_date ||
        !formData.end_date ||
        !formData.monthly_rent
      ) {
        toast.error("Veuillez remplir tous les champs obligatoires")
        setSaving(false)
        return
      }

      // Récupérer le token d'authentification
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error("Vous n'êtes pas connecté ou votre session a expiré")
        setSaving(false)
        return
      }

      const leaseData = {
        property_id: formData.property_id,
        tenant_id: formData.tenant_id,
        start_date: formData.start_date?.toISOString().split("T")[0],
        end_date: formData.end_date?.toISOString().split("T")[0],
        monthly_rent: Number.parseFloat(formData.monthly_rent),
        charges: formData.charges ? Number.parseFloat(formData.charges) : 0,
        deposit: formData.deposit ? Number.parseFloat(formData.deposit) : 0,
        lease_type: formData.lease_type,
        application_id: applicationId || undefined,
        metadata: {
          duration: formData.duration,
          renewable: formData.renewable,
          furnished_items: formData.lease_type === "furnished" ? formData.furnished_items : [],
          special_conditions: formData.special_conditions,
        },
      }

      console.log("📝 Données à envoyer:", leaseData)

      const response = await fetch("/api/leases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(leaseData),
      })

      console.log("📡 Réponse API:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ Erreur API:", errorData)
        throw new Error(errorData.error || "Erreur lors de la création du bail")
      }

      const data = await response.json()
      console.log("✅ Bail créé:", data.lease?.id)

      toast.success("Bail créé avec succès")

      // Rediriger vers la page de completion des données
      router.push(`/owner/leases/${data.lease.id}/complete-data`)

      // Gestion des documents (optionnel pour l'instant)
      if (formData.documents.length > 0) {
        console.log("📎 Upload documents...")
        // TODO: Implémenter l'upload de documents
      }
    } catch (error) {
      console.error("Erreur création bail:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du bail")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  const selectedProperty = properties.find((p) => p.id === formData.property_id)
  const selectedTenant = tenants.find((t) => t.id === formData.tenant_id)

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
          { label: "Nouveau bail", href: "/owner/leases/new" },
        ]}
      />

      <PageHeader
        title="Création d'un nouveau bail"
        description="Remplissez les informations pour générer un contrat de location"
      />

      <div className="mt-6">
        {/* Indicateur d'étapes */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex flex-col items-center ${currentStep >= step ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= step ? "bg-blue-100 border-2 border-blue-600" : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : <span className="font-medium">{step}</span>}
                </div>
                <span className="text-xs font-medium">
                  {step === 1 ? "Parties" : step === 2 ? "Conditions" : step === 3 ? "Détails" : "Finalisation"}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200"></div>
            <div
              className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Étape 1: Sélection du bien et du locataire */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Sélection du bien et du locataire</CardTitle>
              <CardDescription>Choisissez le bien à louer et le locataire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property">Bien immobilier</Label>
                  <Select
                    value={formData.property_id}
                    onValueChange={(value) => handleSelectChange("property_id", value)}
                    disabled={!!applicationId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un bien" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.address}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {properties.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Aucun bien trouvé. Assurez-vous d'avoir créé des annonces.
                    </p>
                  )}
                </div>

                {selectedProperty && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">{selectedProperty.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Adresse:</span>
                        <p>
                          {selectedProperty.address}
                          {selectedProperty.city && `, ${selectedProperty.city}`}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p>{selectedProperty.property_type || selectedProperty.type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Surface:</span>
                        <p>{selectedProperty.surface} m²</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Loyer:</span>
                        <p>{selectedProperty.price} €/mois</p>
                      </div>
                      {selectedProperty.charges && (
                        <div>
                          <span className="text-muted-foreground">Charges:</span>
                          <p>{selectedProperty.charges} €/mois</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Label htmlFor="tenant">Locataire</Label>
                  <Select
                    value={formData.tenant_id}
                    onValueChange={(value) => handleSelectChange("tenant_id", value)}
                    disabled={!!applicationId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name} - {tenant.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tenants.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Aucun locataire trouvé. Les locataires apparaissent après avoir postulé à vos annonces.
                    </p>
                  )}
                </div>

                {selectedTenant && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">
                      {selectedTenant.first_name} {selectedTenant.last_name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{selectedTenant.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Téléphone:</span>
                        <p>{selectedTenant.phone || "Non renseigné"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={nextStep}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Étape 2: Type de bail, dates et loyer */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Type de bail, dates et loyer</CardTitle>
              <CardDescription>Définissez les conditions principales du bail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lease_type">Type de bail</Label>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div
                      className={`flex flex-col items-center justify-between rounded-md border-2 ${
                        formData.lease_type === "unfurnished"
                          ? "border-blue-600 bg-blue-50"
                          : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                      } p-4 cursor-pointer`}
                      onClick={() => handleSelectChange("lease_type", "unfurnished")}
                    >
                      <span className="mb-2">Non meublé</span>
                      <span className="text-xs text-muted-foreground">Bail de 3 ans</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-between rounded-md border-2 ${
                        formData.lease_type === "furnished"
                          ? "border-blue-600 bg-blue-50"
                          : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                      } p-4 cursor-pointer`}
                      onClick={() => handleSelectChange("lease_type", "furnished")}
                    >
                      <span className="mb-2">Meublé</span>
                      <span className="text-xs text-muted-foreground">Bail de 1 an</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-between rounded-md border-2 ${
                        formData.lease_type === "commercial"
                          ? "border-blue-600 bg-blue-50"
                          : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                      } p-4 cursor-pointer`}
                      onClick={() => handleSelectChange("lease_type", "commercial")}
                    >
                      <span className="mb-2">Commercial</span>
                      <span className="text-xs text-muted-foreground">Bail commercial</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.start_date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date
                            ? format(formData.start_date, "PPP", { locale: fr })
                            : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date || undefined}
                          onSelect={(date) => handleDateChange("start_date", date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
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
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.end_date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date
                            ? format(formData.end_date, "PPP", { locale: fr })
                            : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.end_date || undefined}
                          onSelect={(date) => handleDateChange("end_date", date)}
                          disabled={(date) => !formData.start_date || date <= formData.start_date}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent">Loyer mensuel (€)</Label>
                    <Input
                      id="monthly_rent"
                      name="monthly_rent"
                      type="number"
                      value={formData.monthly_rent}
                      onChange={handleInputChange}
                      placeholder="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="charges">Charges (€)</Label>
                    <Input
                      id="charges"
                      name="charges"
                      type="number"
                      value={formData.charges}
                      onChange={handleInputChange}
                      placeholder="150"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit">Dépôt de garantie (€)</Label>
                    <Input
                      id="deposit"
                      name="deposit"
                      type="number"
                      value={formData.deposit}
                      onChange={handleInputChange}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
              <Button onClick={nextStep}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Étape 3: Détails supplémentaires */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Détails supplémentaires</CardTitle>
              <CardDescription>Précisez les détails spécifiques du bail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.lease_type === "furnished" && (
                <div className="space-y-4">
                  <Label>Équipements fournis</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Lit",
                      "Table",
                      "Chaises",
                      "Canapé",
                      "Réfrigérateur",
                      "Four",
                      "Micro-ondes",
                      "Lave-linge",
                      "Vaisselle",
                      "Télévision",
                      "Bureau",
                      "Armoire",
                      "Table de chevet",
                      "Aspirateur",
                      "Fer à repasser",
                    ].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`item-${item}`}
                          checked={formData.furnished_items.includes(item)}
                          onChange={() => handleFurnishedItemToggle(item)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`item-${item}`} className="text-sm">
                          {item}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4">
                <Label htmlFor="special_conditions">Conditions particulières</Label>
                <Textarea
                  id="special_conditions"
                  name="special_conditions"
                  value={formData.special_conditions}
                  onChange={handleInputChange}
                  placeholder="Ajoutez des conditions spéciales au contrat..."
                  rows={6}
                />
              </div>

              <div className="space-y-2 pt-4">
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
              <Button onClick={nextStep}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Étape 4: Récapitulatif et finalisation */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif du bail</CardTitle>
              <CardDescription>Vérifiez les informations avant de créer le bail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Bien immobilier</h3>
                  {selectedProperty && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium">{selectedProperty.title}</h4>
                      <p className="text-sm text-muted-foreground">{selectedProperty.address}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p>{selectedProperty.property_type || selectedProperty.type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Surface:</span>
                          <p>{selectedProperty.surface} m²</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 className="font-semibold">Locataire</h3>
                  {selectedTenant && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium">
                        {selectedTenant.first_name} {selectedTenant.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedTenant.email}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Conditions du bail</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">
                        {formData.lease_type === "unfurnished"
                          ? "Non meublé"
                          : formData.lease_type === "furnished"
                            ? "Meublé"
                            : "Commercial"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Période:</span>
                      <span className="font-medium">
                        {formData.start_date && formData.end_date
                          ? `${format(formData.start_date, "dd/MM/yyyy")} - ${format(formData.end_date, "dd/MM/yyyy")}`
                          : "Non définie"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loyer:</span>
                      <span className="font-medium">{formData.monthly_rent} €/mois</span>
                    </div>
                    {formData.charges && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Charges:</span>
                        <span className="font-medium">{formData.charges} €/mois</span>
                      </div>
                    )}
                    {formData.deposit && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dépôt:</span>
                        <span className="font-medium">{formData.deposit} €</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formData.special_conditions && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Conditions particulières</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">{formData.special_conditions}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Création..." : "Créer le bail"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
