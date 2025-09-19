// Types unifiés pour les baux
export type LeaseStatus = 
  | "draft"                    // Brouillon - en cours de création
  | "sent_to_tenant"          // Envoyé au locataire pour signature
  | "signed_by_tenant"        // Signé par le locataire uniquement
  | "signed_by_owner"         // Signé par le propriétaire uniquement
  | "active"                  // Actif - signé par les deux parties
  | "expired"                 // Expiré
  | "terminated"              // Résilié
  | "renewed"                 // Renouvelé

export type LeaseType = "unfurnished" | "furnished" | "commercial"

export interface Lease {
  id: string
  property_id: string
  tenant_id: string
  owner_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  deposit: number
  lease_type: LeaseType
  status: LeaseStatus
  signed_date?: string
  lease_document_url?: string
  created_at: string
  updated_at: string
  
  // Champs de signature
  signed_by_owner?: boolean
  signed_by_tenant?: boolean
  owner_signature_date?: string
  tenant_signature_date?: string
  sent_to_tenant_at?: string
  
  // Champs DocuSign
  docusign_envelope_id?: string
  docusign_status?: string
  signature_method?: "electronic" | "manual_physical" | "manual_remote"
  
  // Document signé
  signed_document?: string
}

// Configuration des statuts pour l'affichage
export const LEASE_STATUS_CONFIG = {
  draft: { 
    label: "Brouillon", 
    color: "bg-gray-100 text-gray-800",
    description: "Bail en cours de création"
  },
  sent_to_tenant: { 
    label: "En attente de signature", 
    color: "bg-yellow-100 text-yellow-800",
    description: "Envoyé au locataire pour signature"
  },
  signed_by_tenant: { 
    label: "Signé par le locataire", 
    color: "bg-blue-100 text-blue-800",
    description: "En attente de signature du propriétaire"
  },
  signed_by_owner: { 
    label: "Signé par le propriétaire", 
    color: "bg-orange-100 text-orange-800",
    description: "En attente de signature du locataire"
  },
  active: { 
    label: "Actif", 
    color: "bg-green-100 text-green-800",
    description: "Bail signé par les deux parties"
  },
  expired: { 
    label: "Expiré", 
    color: "bg-red-100 text-red-800",
    description: "Bail arrivé à échéance"
  },
  terminated: { 
    label: "Résilié", 
    color: "bg-gray-100 text-gray-800",
    description: "Bail résilié avant échéance"
  },
  renewed: { 
    label: "Renouvelé", 
    color: "bg-blue-100 text-blue-800",
    description: "Bail renouvelé"
  }
} as const

// Fonctions utilitaires
export const leaseStatusUtils = {
  isDraft: (status: LeaseStatus) => status === "draft",
  isPendingSignature: (status: LeaseStatus) => status === "sent_to_tenant",
  isPartiallySigned: (status: LeaseStatus) => 
    status === "signed_by_tenant" || status === "signed_by_owner",
  isFullySigned: (status: LeaseStatus) => status === "active",
  isExpired: (status: LeaseStatus) => status === "expired",
  isTerminated: (status: LeaseStatus) => status === "terminated",
  isRenewed: (status: LeaseStatus) => status === "renewed",
  
  canBeSignedByOwner: (status: LeaseStatus) => 
    status === "draft" || status === "signed_by_tenant",
  canBeSignedByTenant: (status: LeaseStatus) => 
    status === "sent_to_tenant" || status === "signed_by_owner",
  
  getNextStatus: (currentStatus: LeaseStatus, signer: "owner" | "tenant"): LeaseStatus => {
    switch (currentStatus) {
      case "draft":
        return signer === "owner" ? "signed_by_owner" : "sent_to_tenant"
      case "sent_to_tenant":
        return signer === "tenant" ? "signed_by_tenant" : currentStatus
      case "signed_by_tenant":
        return signer === "owner" ? "active" : currentStatus
      case "signed_by_owner":
        return signer === "tenant" ? "active" : currentStatus
      default:
        return currentStatus
    }
  }
}
