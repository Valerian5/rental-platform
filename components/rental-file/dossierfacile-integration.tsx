"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Shield, Star, Upload, ExternalLink, CheckCircle, AlertCircle, Loader2, RefreshCw, X } from "lucide-react"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"
import { DossierFacilePersonProfile } from "@/components/rental-file/dossierfacile-person-profile"
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
              profile={profile}
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
  profile,
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
  profile: any
}) {
  return (
    <div className="space-y-6">
      {/* Lien simple DossierFacile (en attendant les codes API) */}
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Créer votre dossier DossierFacile</h4>
          <p className="text-xs text-gray-600 mb-4">
            Créez votre dossier certifié sur la plateforme officielle DossierFacile
          </p>
          
          <Button 
            asChild
            className="bg-green-600 hover:bg-green-700 px-8 py-3"
            size="lg"
          >
            <a 
              href="https://www.dossierfacile.logement.gouv.fr/?mtm_campaign=LOUERICI&mtm_kwd=rental_file_creation"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Shield className="h-5 w-5 mr-2" />
              Créer mon dossier DossierFacile
            </a>
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Vous serez redirigé vers la plateforme officielle DossierFacile
          </p>
        </div>

        {/* Texte obligatoire selon la documentation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 text-center">
            <strong>DossierFacile est le service numérique de l'État qui permet la constitution d'un dossier de location conforme et sécurisé.</strong>
          </p>
          <p className="text-xs text-blue-700 text-center mt-2">
            Simple d'utilisation, DossierFacile accompagne les candidats locataires dans la création d'un dossier de location numérique, labellisé par l'État. Un outil qui sécurise les informations sensibles des usagers, un tiers de confiance pour tous !
          </p>
        </div>

        {/* Section pour saisir le lien partagé */}
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-sm font-medium mb-2">Une fois votre dossier créé</h4>
            <p className="text-xs text-gray-600 mb-4">
              Après avoir créé et validé votre dossier sur DossierFacile, collez le lien de partage ci-dessous
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dossierfacile_link">Lien de partage DossierFacile</Label>
            <Input
              id="dossierfacile_link"
              placeholder="https://locataire.dossierfacile.logement.gouv.fr/file/..."
              value={data.verification_code || ""}
              onChange={(e) => onUpdate("verification_code", e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Trouvez ce lien dans votre espace DossierFacile > Partager mon dossier
            </p>
          </div>

          <Button 
            onClick={onVerify} 
            disabled={isVerifying || !data.verification_code}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Vérifier le lien DossierFacile
          </Button>
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

      {/* Message d'information sur DossierFacile Connect */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Comment fonctionne DossierFacile Connect ?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Vous vous connectez à votre compte DossierFacile existant</li>
              <li>• Nous importons automatiquement vos données vérifiées</li>
              <li>• Votre dossier est certifié conforme aux exigences légales</li>
              <li>• Les propriétaires font davantage confiance aux dossiers certifiés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
