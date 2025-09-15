"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle, AlertCircle, ExternalLink, Download, Eye } from "lucide-react"
import { DossierFacileBadge, DossierFacileInfoCard } from "./dossierfacile-badge"
import { useState } from "react"

interface ApplicationDossierFacileInfoProps {
  application: any
  dossierFacileData?: any
  onViewDossier?: () => void
  onDownloadDossier?: () => void
}

export function ApplicationDossierFacileInfo({ 
  application, 
  dossierFacileData,
  onViewDossier,
  onDownloadDossier 
}: ApplicationDossierFacileInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Vérifier si l'application a un dossier DossierFacile
  const hasDossierFacile = application.is_dossierfacile_certified || 
                          application.creation_method === "dossierfacile" ||
                          dossierFacileData

  if (!hasDossierFacile) {
    return null
  }

  const handleViewDossier = () => {
    if (onViewDossier) {
      onViewDossier()
    } else if (dossierFacileData?.dossierfacile_pdf_url) {
      window.open(dossierFacileData.dossierfacile_pdf_url, '_blank')
    }
  }

  const handleDownloadDossier = () => {
    if (onDownloadDossier) {
      onDownloadDossier()
    } else if (dossierFacileData?.dossierfacile_pdf_url) {
      const link = document.createElement('a')
      link.href = dossierFacileData.dossierfacile_pdf_url
      link.download = `dossier-facile-${application.tenant?.first_name || 'locataire'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-green-800">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Dossier DossierFacile</span>
            <DossierFacileBadge 
              isDossierFacile={true}
              status={dossierFacileData?.dossierfacile_status || "verified"}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-green-700 hover:text-green-800"
          >
            {isExpanded ? "Masquer" : "Détails"}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">Statut</h4>
            <div className="flex items-center space-x-2">
              {dossierFacileData?.dossierfacile_status === "verified" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm text-green-800">
                {dossierFacileData?.dossierfacile_status === "verified" 
                  ? "Dossier vérifié et certifié" 
                  : "Dossier en cours de vérification"
                }
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">Code de vérification</h4>
            <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
              {dossierFacileData?.dossierfacile_verification_code || "Non disponible"}
            </code>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {dossierFacileData?.dossierfacile_pdf_url && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDossier}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir le dossier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDossier}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <a 
              href="https://www.dossierfacile.logement.gouv.fr" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Site DossierFacile
            </a>
          </Button>
        </div>

        {/* Informations détaillées (expandable) */}
        {isExpanded && dossierFacileData && (
          <div className="pt-4 border-t border-green-200">
            <DossierFacileInfoCard 
              dossierFacileData={dossierFacileData}
              className="bg-white"
            />
            
            {/* Informations de vérification */}
            {dossierFacileData.dossierfacile_verified_at && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <h5 className="text-sm font-medium text-green-800 mb-1">Détails de vérification</h5>
                <p className="text-xs text-green-700">
                  Dossier vérifié le {new Date(dossierFacileData.dossierfacile_verified_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {dossierFacileData.dossierfacile_id && (
                  <p className="text-xs text-green-700 mt-1">
                    ID DossierFacile: {dossierFacileData.dossierfacile_id}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Avantages du dossier DossierFacile */}
        <div className="bg-green-100 p-3 rounded-lg">
          <h5 className="text-sm font-medium text-green-800 mb-2">Avantages de ce dossier</h5>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Dossier certifié par l'État français</li>
            <li>• Documents vérifiés et authentifiés</li>
            <li>• Conformité garantie avec la réglementation</li>
            <li>• Réduction des risques de fraude</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
