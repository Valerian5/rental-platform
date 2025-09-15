"use client"

import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, AlertCircle } from "lucide-react"

interface DossierFacileBadgeProps {
  isDossierFacile?: boolean
  isVerified?: boolean
  status?: "pending" | "verified" | "rejected" | "converted"
  className?: string
}

export function DossierFacileBadge({ 
  isDossierFacile, 
  isVerified, 
  status = "verified",
  className = "" 
}: DossierFacileBadgeProps) {
  if (!isDossierFacile) {
    return null
  }

  const getBadgeConfig = () => {
    switch (status) {
      case "verified":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          text: "DossierFacile Certifié",
        }
      case "pending":
        return {
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Shield className="h-3 w-3 mr-1" />,
          text: "DossierFacile En Attente",
        }
      case "rejected":
        return {
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          text: "DossierFacile Rejeté",
        }
      case "converted":
        return {
          variant: "default" as const,
          className: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          text: "DossierFacile Converti",
        }
      default:
        return {
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Shield className="h-3 w-3 mr-1" />,
          text: "DossierFacile",
        }
    }
  }

  const config = getBadgeConfig()

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {config.icon}
      {config.text}
    </Badge>
  )
}

export function DossierFacileInfoCard({ 
  dossierFacileData, 
  className = "" 
}: { 
  dossierFacileData?: any
  className?: string 
}) {
  if (!dossierFacileData) {
    return null
  }

  const data = dossierFacileData.dossierfacile_data
  if (!data) {
    return null
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Shield className="h-5 w-5 text-green-600" />
        <h4 className="font-medium text-green-800">Dossier DossierFacile</h4>
        <DossierFacileBadge 
          isDossierFacile={true} 
          status={dossierFacileData.dossierfacile_status}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {data.professional_info?.profession && (
          <div>
            <span className="text-green-700 font-medium">Profession:</span>
            <span className="text-green-800 ml-1">{data.professional_info.profession}</span>
          </div>
        )}
        
        {data.professional_info?.company && (
          <div>
            <span className="text-green-700 font-medium">Entreprise:</span>
            <span className="text-green-800 ml-1">{data.professional_info.company}</span>
          </div>
        )}
        
        {data.professional_info?.monthly_income && (
          <div>
            <span className="text-green-700 font-medium">Revenus:</span>
            <span className="text-green-800 ml-1">{data.professional_info.monthly_income}€/mois</span>
          </div>
        )}
        
        {data.professional_info?.contract_type && (
          <div>
            <span className="text-green-700 font-medium">Contrat:</span>
            <span className="text-green-800 ml-1">{data.professional_info.contract_type}</span>
          </div>
        )}
      </div>
      
      {dossierFacileData.dossierfacile_verified_at && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-xs text-green-600">
            Vérifié le {new Date(dossierFacileData.dossierfacile_verified_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}
    </div>
  )
}
