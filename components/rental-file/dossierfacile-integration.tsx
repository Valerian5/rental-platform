"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Shield, Star, Upload, ExternalLink, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"
import { toast } from "sonner"

interface DossierFacileIntegrationProps {
  profile: any
  onUpdate: (profile: any) => void
}

export function DossierFacileIntegration({ profile, onUpdate }: DossierFacileIntegrationProps) {
  const [selectedMethod, setSelectedMethod] = useState<"manual" | "dossierfacile" | null>(
    profile.creation_method || null,
  )
  const [dossierFacileData, setDossierFacileData] = useState({
    pdf_url: profile.dossierfacile_pdf_url || "",
    verification_code: profile.dossierfacile_verification_code || "",
    monthly_income: profile.monthly_income || "",
    profession: profile.profession || "",
    company: profile.company || "",
    contract_type: profile.contract_type || "",
    guarantor_type: profile.guarantor_type || "",
    presentation_message: profile.presentation_message || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [dossierFacileStatus, setDossierFacileStatus] = useState<"none" | "pending" | "verified" | "error">("none")
  const [dossierFacileInfo, setDossierFacileInfo] = useState<any>(null)

  // Charger les données DossierFacile existantes au montage
  useEffect(() => {
    if (profile.creation_method === "dossierfacile" && profile.dossierfacile_verification_code) {
      loadDossierFacileData()
    }
  }, [profile.creation_method])

  const loadDossierFacileData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/dossierfacile?tenant_id=${profile.tenant_id || ""}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setDossierFacileInfo(data.data)
        setDossierFacileStatus("verified")
        
        // Pré-remplir les données
        const dfData = data.data.dossierfacile_data
        if (dfData) {
          setDossierFacileData({
            ...dossierFacileData,
            monthly_income: dfData.professional_info?.monthly_income || "",
            profession: dfData.professional_info?.profession || "",
            company: dfData.professional_info?.company || "",
            contract_type: dfData.professional_info?.contract_type || "",
          })
        }
      } else {
        setDossierFacileStatus("none")
      }
    } catch (error) {
      console.error("Erreur chargement DossierFacile:", error)
      setDossierFacileStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMethodSelection = (method: "manual" | "dossierfacile") => {
    setSelectedMethod(method)
    onUpdate({
      ...profile,
      creation_method: method,
      is_dossierfacile_certified: method === "dossierfacile",
    })
  }

  const handleDossierFacileDataUpdate = (field: string, value: string) => {
    const updatedData = { ...dossierFacileData, [field]: value }
    setDossierFacileData(updatedData)
    onUpdate({ ...profile, ...updatedData })
  }

  const handlePdfUpload = (urls: string[]) => {
    if (urls.length > 0) {
      handleDossierFacileDataUpdate("pdf_url", urls[0])
      toast.success("Dossier DossierFacile importé avec succès")
    }
  }

  const handleConnectDossierFacile = async () => {
    setIsVerifying(true)
    try {
      // Rediriger vers l'API de connexion DossierFacile Connect
      window.location.href = "/api/dossierfacile/connect"
    } catch (error) {
      console.error("Erreur connexion DossierFacile:", error)
      setDossierFacileStatus("error")
      toast.error("Erreur lors de la connexion à DossierFacile")
      setIsVerifying(false)
    }
  }

  const handleConvertToRentalFile = async () => {
    if (!dossierFacileInfo) {
      toast.error("Aucun dossier DossierFacile vérifié")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/dossierfacile/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: profile.tenant_id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Dossier converti en RentalFile avec succès !")
        // Recharger la page pour afficher les nouvelles données
        window.location.reload()
      } else {
        toast.error(data.error || "Erreur lors de la conversion")
      }
    } catch (error) {
      console.error("Erreur conversion:", error)
      toast.error("Erreur lors de la conversion du dossier")
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedMethod) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedMethod === "dossierfacile" ? (
                <>
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Dossier DossierFacile</span>
                  <Badge className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    Certifié
                  </Badge>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Dossier manuel</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMethod(null)
                onUpdate({ ...profile, creation_method: null })
              }}
            >
              Changer de méthode
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedMethod === "dossierfacile" ? (
            <DossierFacileForm
              data={dossierFacileData}
              onUpdate={handleDossierFacileDataUpdate}
              onPdfUpload={handlePdfUpload}
              onVerify={handleConnectDossierFacile}
              onConvert={handleConvertToRentalFile}
              isLoading={isLoading}
              isVerifying={isVerifying}
              dossierFacileStatus={dossierFacileStatus}
              dossierFacileInfo={dossierFacileInfo}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">
                Continuez à remplir votre dossier manuellement avec les étapes ci-dessous.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Comment souhaitez-vous créer votre dossier ?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option DossierFacile */}
          <Card
            className="cursor-pointer border-2 border-green-200 bg-green-50/50 hover:border-green-300 transition-all"
            onClick={() => handleMethodSelection("dossierfacile")}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-green-800 mb-2">Via DossierFacile</h3>
                <Badge className="bg-green-100 text-green-800 mb-3">
                  <Star className="h-3 w-3 mr-1" />
                  Recommandé
                </Badge>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Dossier certifié conforme</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Démarquez-vous des autres candidats</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Validation officielle des documents</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Accepté par tous les propriétaires</span>
                  </div>
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Choisir DossierFacile
              </Button>
            </CardContent>
          </Card>

          {/* Option manuelle */}
          <Card
            className="cursor-pointer border-2 border-blue-200 bg-blue-50/50 hover:border-blue-300 transition-all"
            onClick={() => handleMethodSelection("manual")}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-800 mb-2">Création manuelle</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Contrôle total de vos données</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Pas de compte externe requis</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Plus long à compléter</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Pas de certification officielle</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                <Upload className="h-4 w-4 mr-2" />
                Créer manuellement
              </Button>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Pourquoi choisir DossierFacile ?</strong>
            <br />
            DossierFacile est le service public numérique qui certifie la conformité de votre dossier de location. Les
            propriétaires font davantage confiance aux dossiers certifiés, ce qui augmente vos chances d'obtenir un
            logement.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

function DossierFacileForm({
  data,
  onUpdate,
  onPdfUpload,
  onVerify,
  onConvert,
  isLoading,
  isVerifying,
  dossierFacileStatus,
  dossierFacileInfo,
}: {
  data: any
  onUpdate: (field: string, value: string) => void
  onPdfUpload: (urls: string[]) => void
  onVerify: () => void
  onConvert: () => void
  isLoading: boolean
  isVerifying: boolean
  dossierFacileStatus: "none" | "pending" | "verified" | "error"
  dossierFacileInfo: any
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Étapes à suivre :</strong>
          <br />
          1. Créez votre dossier sur{" "}
          <a
            href="https://www.dossierfacile.logement.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            DossierFacile.gouv.fr
          </a>
          <br />
          2. Récupérez votre code de vérification
          <br />
          3. Saisissez-le ci-dessous pour importer automatiquement vos données
        </AlertDescription>
      </Alert>

      <div className="flex justify-center">
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <a href="https://www.dossierfacile.logement.gouv.fr" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Créer mon dossier DossierFacile
          </a>
        </Button>
      </div>

      {/* Connexion DossierFacile Connect */}
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Connexion à DossierFacile</h4>
          <p className="text-xs text-gray-600 mb-4">
            Connectez-vous à votre compte DossierFacile pour importer automatiquement vos données
          </p>
          
          <Button 
            onClick={onVerify} 
            disabled={isVerifying}
            className="bg-green-600 hover:bg-green-700 px-8 py-3"
            size="lg"
          >
            {isVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Shield className="h-5 w-5 mr-2" />
            )}
            Se connecter à DossierFacile
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Vous serez redirigé vers la plateforme officielle DossierFacile
          </p>
        </div>

        {/* Statut de vérification */}
        {dossierFacileStatus === "verified" && dossierFacileInfo && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Dossier DossierFacile vérifié !</strong>
              <br />
              Votre dossier a été importé avec succès. Vous pouvez maintenant le convertir en RentalFile.
            </AlertDescription>
          </Alert>
        )}

        {dossierFacileStatus === "error" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erreur de vérification</strong>
              <br />
              Le code de vérification est invalide ou le dossier n'est pas accessible.
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton de conversion */}
        {dossierFacileStatus === "verified" && (
          <div className="flex justify-center">
            <Button 
              onClick={onConvert} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Convertir en RentalFile
            </Button>
          </div>
        )}
      </div>

      {/* Upload manuel de PDF (fallback) */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium mb-2">Ou importez manuellement votre PDF</h4>
        <p className="text-xs text-gray-600 mb-2">
          Si vous préférez, vous pouvez télécharger et importer manuellement votre dossier PDF
        </p>
        <SupabaseFileUpload
          onFilesUploaded={onPdfUpload}
          maxFiles={1}
          bucket="documents"
          folder="dossierfacile"
          existingFiles={data.pdf_url ? [data.pdf_url] : []}
          acceptedTypes={["application/pdf"]}
          showPreview={true}
        />
      </div>

      {/* Informations extraites */}
      {dossierFacileStatus === "verified" && dossierFacileInfo?.dossierfacile_data && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Informations extraites de votre dossier DossierFacile</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs text-gray-600">Profession</Label>
              <p className="text-sm font-medium">
                {dossierFacileInfo.dossierfacile_data.professional_info?.profession || "Non renseigné"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Entreprise</Label>
              <p className="text-sm font-medium">
                {dossierFacileInfo.dossierfacile_data.professional_info?.company || "Non renseigné"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Type de contrat</Label>
              <p className="text-sm font-medium">
                {dossierFacileInfo.dossierfacile_data.professional_info?.contract_type || "Non renseigné"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Revenus mensuels</Label>
              <p className="text-sm font-medium">
                {dossierFacileInfo.dossierfacile_data.professional_info?.monthly_income 
                  ? `${dossierFacileInfo.dossierfacile_data.professional_info.monthly_income}€`
                  : "Non renseigné"
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire manuel supprimé - DossierFacile Connect gère tout automatiquement */}

      {data.pdf_url && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Dossier DossierFacile importé</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Votre dossier certifié sera visible par les propriétaires avec un badge spécial.
          </p>
        </div>
      )}
    </div>
  )
}
