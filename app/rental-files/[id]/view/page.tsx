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

      const response = await fetch(`/api/rental-files?id=${params.id}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur API:", errorText)
        toast.error("Erreur lors du chargement du dossier")
        return
      }

      const data = await response.json()
      console.log("✅ Dossier chargé:", data)
      setRentalFile(data.rental_file)
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

  if (!rentalFile) {
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

  const mainTenant = rentalFile.main_tenant || {}
  const tenantName = `${mainTenant.first_name || "Prénom"} ${mainTenant.last_name || "Nom"}`
  const income = mainTenant.income_sources?.work_income?.amount || 0
  const guarantors = rentalFile.guarantors || []

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
            <div>
              <label className="text-sm font-medium text-muted-foreground">Situation logement actuelle</label>
              <p>{mainTenant.current_housing_situation || "Non spécifié"}</p>
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
              <label className="text-sm font-medium text-muted-foreground">Type de revenus</label>
              <p>{mainTenant.income_sources?.work_income?.type || "Non spécifié"}</p>
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
                <p className="text-lg font-semibold text-green-600">{formatAmount(income)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type de revenus</label>
                <p>{mainTenant.income_sources?.work_income?.type || "Non spécifié"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Garants */}
        {guarantors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Garants ({guarantors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guarantors.map((guarantor, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Garant {index + 1}</h4>
                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <p>{guarantor.type === "physical" ? "Personne physique" : "Personne morale"}</p>
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
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Activité</label>
                        <p>{guarantor.personal_info?.main_activity || "Non spécifié"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Situation logement</label>
                        <p>{guarantor.personal_info?.current_housing_situation || "Non spécifié"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pièces jointes */}
        <Card>
          <CardHeader>
            <CardTitle>Pièces jointes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Documents d'identité */}
              {mainTenant.identity_documents && mainTenant.identity_documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Pièces d'identité du locataire</h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {mainTenant.identity_documents.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Pièce d'identité {index + 1}</span>
                        </div>
                        <img
                          src={doc || "/placeholder.svg"}
                          alt={`Pièce d'identité ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                        <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Document</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(doc, "_blank")}
                        >
                          Voir le document
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents d'activité */}
              {mainTenant.activity_documents && mainTenant.activity_documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Justificatifs d'activité</h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {mainTenant.activity_documents.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Justificatif {index + 1}</span>
                        </div>
                        <img
                          src={doc || "/placeholder.svg"}
                          alt={`Justificatif d'activité ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                        <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Document</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(doc, "_blank")}
                        >
                          Voir le document
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents de revenus */}
              {mainTenant.income_sources?.work_income?.documents &&
                mainTenant.income_sources.work_income.documents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Justificatifs de revenus</h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {mainTenant.income_sources.work_income.documents.map((doc, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Justificatif revenus {index + 1}</span>
                          </div>
                          <img
                            src={doc || "/placeholder.svg"}
                            alt={`Justificatif de revenus ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                          <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                            <div className="text-center">
                              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">Document</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => window.open(doc, "_blank")}
                          >
                            Voir le document
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Documents fiscaux */}
              {mainTenant.tax_situation?.documents && mainTenant.tax_situation.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Documents fiscaux</h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {mainTenant.tax_situation.documents.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium">Document fiscal {index + 1}</span>
                        </div>
                        <img
                          src={doc || "/placeholder.svg"}
                          alt={`Document fiscal ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                        <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Document</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(doc, "_blank")}
                        >
                          Voir le document
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents de logement actuel */}
              {mainTenant.current_housing_documents?.quittances_loyer &&
                mainTenant.current_housing_documents.quittances_loyer.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Quittances de loyer</h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {mainTenant.current_housing_documents.quittances_loyer.map((doc, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">Quittance {index + 1}</span>
                          </div>
                          <img
                            src={doc || "/placeholder.svg"}
                            alt={`Quittance de loyer ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                          <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                            <div className="text-center">
                              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">Document</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => window.open(doc, "_blank")}
                          >
                            Voir le document
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Documents des garants */}
              {guarantors.length > 0 && guarantors.some((g) => g.personal_info?.identity_documents?.length > 0) && (
                <div>
                  <h4 className="font-medium mb-3">Documents des garants</h4>
                  {guarantors.map(
                    (guarantor, gIndex) =>
                      guarantor.personal_info?.identity_documents &&
                      guarantor.personal_info.identity_documents.length > 0 && (
                        <div key={gIndex} className="mb-4">
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">
                            Garant {gIndex + 1} - {guarantor.personal_info.first_name}{" "}
                            {guarantor.personal_info.last_name}
                          </h5>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {guarantor.personal_info.identity_documents.map((doc, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-indigo-500" />
                                  <span className="text-sm font-medium">Pièce d'identité {index + 1}</span>
                                </div>
                                <img
                                  src={doc || "/placeholder.svg"}
                                  alt={`Pièce d'identité garant ${gIndex + 1}`}
                                  className="w-full h-32 object-cover rounded border"
                                  onError={(e) => {
                                    e.target.style.display = "none"
                                    e.target.nextSibling.style.display = "flex"
                                  }}
                                />
                                <div className="hidden items-center justify-center h-32 bg-gray-100 rounded border">
                                  <div className="text-center">
                                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">Document</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => window.open(doc, "_blank")}
                                >
                                  Voir le document
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
