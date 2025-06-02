"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ArrowLeft, Download, Printer, FileText } from "lucide-react"

export default function RentalFileViewerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rentalFile, setRentalFile] = useState(null)
  const [rentalFileData, setRentalFileData] = useState(null)

  useEffect(() => {
    loadRentalFile()
  }, [])

  const loadRentalFile = async () => {
    try {
      setLoading(true)
      console.log("🔍 Chargement dossier ID:", params.id)

      const response = await fetch(`/api/rental-files/${params.id}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur API:", errorText)
        toast.error("Erreur lors du chargement du dossier")
        return
      }

      const data = await response.json()
      console.log("✅ Dossier chargé:", data)
      setRentalFile(data.rental_file)
      setRentalFileData(data.rental_file_data)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement du dossier")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      toast.info("Génération du PDF en cours...")
      // Ici on pourrait appeler une API pour générer le PDF
      // Pour l'instant, on simule le téléchargement
      const link = document.createElement("a")
      link.href = `/placeholder.svg?height=800&width=600&query=Dossier de location PDF`
      link.download = `dossier-location-${params.id}.pdf`
      link.click()
      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la génération du PDF")
    }
  }

  const formatAmount = (amount) => {
    if (!amount) return "Non spécifié"
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!rentalFile && !rentalFileData) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Dossier introuvable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Le dossier de location demandé n'existe pas ou vous n'avez pas les permissions nécessaires.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mainTenant = rentalFileData?.main_tenant || {}
  const tenantName = `${mainTenant.first_name || "Prénom"} ${mainTenant.last_name || "Nom"}`

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Dossier de location - {tenantName}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Aperçu du dossier */}
      <div className="grid gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
              <p>{tenantName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
              <p>{mainTenant.birth_date || "Non spécifié"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Lieu de naissance</label>
              <p>{mainTenant.birth_place || "Non spécifié"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nationalité</label>
              <p>{mainTenant.nationality || "Non spécifié"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Situation professionnelle */}
        <Card>
          <CardHeader>
            <CardTitle>Situation professionnelle</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Activité principale</label>
              <p>{mainTenant.main_activity || "Non spécifié"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profession</label>
              <p>{mainTenant.profession || rentalFile?.profession || "Non spécifié"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Entreprise</label>
              <p>{mainTenant.company || rentalFile?.company || "Non spécifié"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Revenus */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Revenus du travail</label>
                <p className="text-lg font-semibold text-green-600">
                  {formatAmount(mainTenant.income_sources?.work_income?.amount || rentalFile?.monthly_income || 0)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Revenus totaux</label>
                <p className="text-lg font-semibold">
                  {formatAmount(mainTenant.income_sources?.work_income?.amount || rentalFile?.monthly_income || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Garants */}
        {(rentalFileData?.guarantors?.length > 0 || rentalFile?.has_guarantor) && (
          <Card>
            <CardHeader>
              <CardTitle>Garants</CardTitle>
            </CardHeader>
            <CardContent>
              {rentalFileData?.guarantors?.length > 0 ? (
                <div className="space-y-4">
                  {rentalFileData.guarantors.map((guarantor, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Garant {index + 1}</h4>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Type</label>
                          <p>{guarantor.type || "Non spécifié"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nom</label>
                          <p>
                            {guarantor.personal_info?.first_name} {guarantor.personal_info?.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Revenus</label>
                          <p>{formatAmount(guarantor.personal_info?.income_sources?.work_income?.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>Garant présent (informations dans le dossier simple)</p>
                  {rentalFile?.guarantor_income && (
                    <p>Revenus du garant: {formatAmount(rentalFile.guarantor_income)}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Message de présentation */}
        {(rentalFileData?.presentation_message || rentalFile?.presentation_message) && (
          <Card>
            <CardHeader>
              <CardTitle>Message de présentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {rentalFileData?.presentation_message || rentalFile?.presentation_message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Simulation PDF */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du dossier PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 flex justify-center">
              <div className="w-full max-w-2xl bg-white border rounded-lg p-6 shadow-sm">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">DOSSIER DE LOCATION</h2>
                  <p className="text-gray-600">{tenantName}</p>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="border-b pb-2">
                    <strong>Situation professionnelle:</strong> {mainTenant.profession || "Non spécifié"}
                  </div>
                  <div className="border-b pb-2">
                    <strong>Revenus mensuels:</strong>{" "}
                    {formatAmount(mainTenant.income_sources?.work_income?.amount || rentalFile?.monthly_income || 0)}
                  </div>
                  <div className="border-b pb-2">
                    <strong>Garants:</strong>{" "}
                    {rentalFileData?.guarantors?.length > 0 || rentalFile?.has_guarantor ? "Oui" : "Non"}
                  </div>
                  <div className="text-center text-gray-500 mt-6">
                    <p>Ceci est un aperçu simplifié du dossier PDF complet</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
