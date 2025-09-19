// Service pour gérer le workflow de signature des baux
// Gère les 3 scénarios : électronique, manuelle physique, manuelle à distance

export interface SignatureWorkflowState {
  leaseId: string
  status: SignatureStatus
  signatureMethod: SignatureMethod
  ownerSigned: boolean
  tenantSigned: boolean
  ownerSignatureDate?: string
  tenantSignatureDate?: string
  signedDocument?: string // URL du document final signé
  createdAt: string
  updatedAt: string
}

export type SignatureStatus = 
  | "draft"                    // Brouillon
  | "ready_for_signature"      // Prêt à être signé (owner a initié)
  | "owner_signed_electronically" // Owner a signé électroniquement
  | "tenant_signed_electronically" // Tenant a signé électroniquement
  | "owner_signed_manually"    // Owner a signé manuellement
  | "tenant_signed_manually"   // Tenant a signé manuellement
  | "fully_signed"             // Signé par les deux parties
  | "cancelled"                // Annulé

export type SignatureMethod = 
  | "electronic"               // Signature électronique (DocuSign)
  | "manual_physical"          // Signature manuelle physique (remise des clés)
  | "manual_remote"            // Signature manuelle à distance

export class SignatureWorkflowService {
  // Démarre le processus de signature (appelé par l'owner)
  static async initiateSignature(
    leaseId: string, 
    method: SignatureMethod
  ): Promise<SignatureWorkflowState> {
    // Logique pour initialiser le workflow selon la méthode choisie
    const state: SignatureWorkflowState = {
      leaseId,
      status: "ready_for_signature",
      signatureMethod: method,
      ownerSigned: false,
      tenantSigned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // TODO: Sauvegarder en base de données
    // TODO: Envoyer notification au tenant
    
    return state
  }

  // Signature électronique par l'owner
  static async signElectronicallyAsOwner(leaseId: string): Promise<SignatureWorkflowState> {
    // TODO: Intégration DocuSign
    // TODO: Mise à jour du statut
    // TODO: Notification au tenant
    
    throw new Error("Not implemented")
  }

  // Signature électronique par le tenant
  static async signElectronicallyAsTenant(leaseId: string): Promise<SignatureWorkflowState> {
    // TODO: Intégration DocuSign
    // TODO: Mise à jour du statut
    // TODO: Notification à l'owner
    
    throw new Error("Not implemented")
  }

  // Upload de document signé manuellement par l'owner
  static async uploadManualSignatureAsOwner(
    leaseId: string, 
    signedDocument: File
  ): Promise<SignatureWorkflowState> {
    // TODO: Upload du document
    // TODO: Mise à jour du statut
    // TODO: Notification au tenant
    
    throw new Error("Not implemented")
  }

  // Upload de document signé manuellement par le tenant
  static async uploadManualSignatureAsTenant(
    leaseId: string, 
    signedDocument: File
  ): Promise<SignatureWorkflowState> {
    // TODO: Upload du document
    // TODO: Mise à jour du statut
    // TODO: Notification à l'owner
    
    throw new Error("Not implemented")
  }

  // Récupère l'état actuel du workflow
  static async getWorkflowState(leaseId: string): Promise<SignatureWorkflowState | null> {
    // TODO: Récupérer depuis la base de données
    
    throw new Error("Not implemented")
  }

  // Détermine les actions possibles pour un utilisateur
  static getAvailableActions(
    state: SignatureWorkflowState, 
    userType: "owner" | "tenant"
  ): string[] {
    const actions: string[] = []

    switch (state.status) {
      case "draft":
        if (userType === "owner") {
          actions.push("initiate_signature")
        }
        break

      case "ready_for_signature":
        if (userType === "owner") {
          if (state.signatureMethod === "electronic") {
            actions.push("sign_electronically")
          } else {
            actions.push("download_document", "upload_signed_document")
          }
        } else if (userType === "tenant") {
          if (state.signatureMethod === "electronic") {
            actions.push("sign_electronically")
          } else {
            actions.push("download_document", "upload_signed_document")
          }
        }
        break

      case "owner_signed_electronically":
        if (userType === "tenant") {
          actions.push("sign_electronically")
        }
        break

      case "owner_signed_manually":
        if (userType === "tenant") {
          actions.push("download_document", "upload_signed_document")
        }
        break

      case "tenant_signed_electronically":
        if (userType === "owner") {
          actions.push("sign_electronically")
        }
        break

      case "tenant_signed_manually":
        if (userType === "owner") {
          actions.push("download_document", "upload_signed_document")
        }
        break

      case "fully_signed":
        actions.push("download_signed_document")
        break
    }

    return actions
  }

  // Détermine l'interface à afficher selon l'état
  static getInterfaceState(
    state: SignatureWorkflowState, 
    userType: "owner" | "tenant"
  ) {
    const actions = this.getAvailableActions(state, userType)
    
    return {
      showSignatureSelector: actions.includes("initiate_signature"),
      showElectronicSignature: actions.includes("sign_electronically"),
      showManualSignature: actions.includes("download_document") || actions.includes("upload_signed_document"),
      showDownloadSigned: actions.includes("download_signed_document"),
      showStatusDisplay: state.status === "fully_signed",
      canSign: actions.includes("sign_electronically") || actions.includes("upload_signed_document"),
      canDownload: actions.includes("download_document") || actions.includes("download_signed_document"),
    }
  }
}

// Helper pour les notifications
export class SignatureNotificationService {
  static async notifySignatureRequired(leaseId: string, userType: "owner" | "tenant") {
    // TODO: Envoyer notification + email
  }

  static async notifySignatureCompleted(leaseId: string, userType: "owner" | "tenant") {
    // TODO: Envoyer notification + email
  }

  static async notifyFullySigned(leaseId: string) {
    // TODO: Envoyer notification + email aux deux parties
  }
}
