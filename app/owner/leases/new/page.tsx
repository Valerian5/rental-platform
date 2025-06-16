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
import { createBrowserClient } from "@supabase/ssr"

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Charger les propriétés du propriétaire
      try {
        const propertiesResponse = await fetch(`/api/properties?owner_id=${currentUser.id}`)
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
                charges: app.property?.charges?.toString() || "",
                deposit: (app.property?.price * 1).toString() || "",
              }))

              // Charger les détails du locataire
              if (app.tenant_id) {
                try {
                  const tenantResponse = await fetch(`/api/applications/${applicationId}/tenant`)
                  if (tenantResponse.ok) {
                    const tenantData = await tenantResponse.json()
                    console.log("👤 Locataire chargé:", tenantData.tenant?.email)
                    if (tenantData.tenant) {
                      setTenants([tenantData.tenant])
                    }
                  } else {
                    console.error("Erreur chargement locataire:", tenantResponse.status)
                  }
                } catch (error) {
                  console.error("Erreur locataire:", error)
                }
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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData((prev) => ({ ...prev, [name]: date }))
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

      // Récupérer le token de session avec @supabase/ssr
      const supabase = createBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session?.access_token) {
        toast.error("Vous n'êtes pas connecté ou votre session a expiré")
        setSaving(false)
        return
      }

      const response = await fetch("/api/leases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
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

      // Gestion des documents (optionnel pour l'instant)
      if (formData.documents.length > 0) {
        console.log("📎 Upload documents...")
        // TODO: Implémenter l'upload de documents
      }

      toast.success("Bail créé avec succès")
      router.push(`/owner/leases/${data.lease.id}`)
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
        {/* ... le reste du code du formulaire (inchangé) ... */}
        {/* <=== Garde le reste de ton JSX comme il est, rien à changer ci-dessous ===> */}
        {/* ... */}
      </div>
    </div>
  )
}