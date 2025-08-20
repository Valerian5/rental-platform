import jwt from "jsonwebtoken"
import { supabase } from "./supabase"

export interface DocuSignEnvelope {
  envelopeId: string
  status: string
  documentsUri?: string
  recipientsUri?: string
  createdDateTime: string
  sentDateTime?: string
  completedDateTime?: string
}

export interface DocuSignRecipient {
  email: string
  name: string
  recipientId: string
  routingOrder: string
  roleName?: string
}

export interface DocuSignDocument {
  documentId: string
  name: string
  documentBase64?: string
  fileExtension: string
}

class DocuSignService {
  private baseUrl: string
  private accountId: string
  private accessToken: string | null
  private tokenExpiration: number

  constructor() {
    this.baseUrl = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi"
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || ""
    this.accessToken = null
    this.tokenExpiration = 0
  }

  /** 🔑 Génère un JWT */
  private generateJWT(): string {
    const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || "").replace(/\\n/g, "\n")

    return jwt.sign(
      {
        iss: process.env.DOCUSIGN_INTEGRATION_KEY,
        sub: process.env.DOCUSIGN_USER_ID,
        aud: "account-d.docusign.com",
        scope: "signature impersonation",
      },
      privateKey,
      { algorithm: "RS256", expiresIn: "1h" },
    )
  }

  /** 🔄 Récupère ou renouvelle l’accessToken */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiration - 60_000) {
      return this.accessToken
    }

    const assertion = this.generateJWT()
    const res = await fetch("https://account-d.docusign.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`DocuSign Auth Error: ${res.status} - ${text}`)
    }

    const data = await res.json()
    this.accessToken = data.access_token
    this.tokenExpiration = Date.now() + data.expires_in * 1000
    return this.accessToken
  }

  /** ⚡️ Requête générique */
  private async makeRequest(endpoint: string, method = "GET", body?: any) {
    const token = await this.getAccessToken()
    const url = `${this.baseUrl}/v2.1/accounts/${this.accountId}${endpoint}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    const config: RequestInit = { method, headers }
    if (body && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(body)
    }

    const response = await fetch(url, config)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DocuSign API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // -------------------- API MÉTHODES --------------------

  async createEnvelope(
    documents: DocuSignDocument[],
    recipients: DocuSignRecipient[],
    emailSubject: string,
    emailMessage: string,
    status: "sent" | "created" = "sent",
  ): Promise<DocuSignEnvelope> {
    const envelopeDefinition = {
      emailSubject,
      emailMessage,
      documents: documents.map((doc) => ({
        documentId: doc.documentId,
        name: doc.name,
        fileExtension: doc.fileExtension,
        documentBase64: doc.documentBase64,
      })),
      recipients: {
        signers: recipients.map((recipient) => ({
          email: recipient.email,
          name: recipient.name,
          recipientId: recipient.recipientId,
          routingOrder: recipient.routingOrder,
          roleName: recipient.roleName || "Signataire",
          tabs: {
            signHereTabs: [{ documentId: "1", pageNumber: "1", xPosition: "100", yPosition: "100" }],
            dateSignedTabs: [{ documentId: "1", pageNumber: "1", xPosition: "300", yPosition: "100" }],
          },
        })),
      },
      status,
    }

    return await this.makeRequest("/envelopes", "POST", envelopeDefinition)
  }

  async getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope> {
    return await this.makeRequest(`/envelopes/${envelopeId}`)
  }

  async getEnvelopeDocuments(envelopeId: string): Promise<any> {
    return await this.makeRequest(`/envelopes/${envelopeId}/documents`)
  }

  async downloadCompletedDocument(envelopeId: string, documentId = "combined"): Promise<Blob> {
    const token = await this.getAccessToken()
    const url = `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}/documents/${documentId}`

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" },
    })

    if (!response.ok) throw new Error(`Erreur téléchargement document: ${response.status}`)
    return response.blob()
  }

  async createEmbeddedSigningView(envelopeId: string, recipientEmail: string, returnUrl: string): Promise<string> {
    const viewRequest = {
      returnUrl,
      authenticationMethod: "none",
      email: recipientEmail,
      userName: recipientEmail,
      clientUserId: recipientEmail,
    }

    const response = await this.makeRequest(`/envelopes/${envelopeId}/views/recipient`, "POST", viewRequest)
    return response.url
  }

  /** 🔑 Fonction principale appelée par ton endpoint */
  async sendLeaseForSignature(
    leaseId: string,
    documentContent: string,
    ownerEmail: string,
    ownerName: string,
    tenantEmail: string,
    tenantName: string,
  ): Promise<{ envelopeId: string; signingUrls: { owner: string; tenant: string } }> {
    console.log("📝 [DOCUSIGN] Envoi du bail pour signature:", leaseId)

    const documentBase64 = Buffer.from(documentContent).toString("base64")

    const documents: DocuSignDocument[] = [
      { documentId: "1", name: `Contrat de bail - ${leaseId}`, fileExtension: "html", documentBase64 },
    ]

    const recipients: DocuSignRecipient[] = [
      { email: ownerEmail, name: ownerName, recipientId: "1", routingOrder: "1", roleName: "Bailleur" },
      { email: tenantEmail, name: tenantName, recipientId: "2", routingOrder: "2", roleName: "Locataire" },
    ]

    const envelope = await this.createEnvelope(
      documents,
      recipients,
      `Signature du contrat de bail - ${leaseId}`,
      "Veuillez signer ce contrat de bail en cliquant sur le lien ci-dessous.",
      "sent",
    )

    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/owner/leases/${leaseId}?signed=true`
    const ownerSigningUrl = await this.createEmbeddedSigningView(envelope.envelopeId, ownerEmail, returnUrl)
    const tenantSigningUrl = await this.createEmbeddedSigningView(envelope.envelopeId, tenantEmail, returnUrl)

    await supabase.from("leases").update({
      docusign_envelope_id: envelope.envelopeId,
      status: "sent_for_signature",
      updated_at: new Date().toISOString(),
    }).eq("id", leaseId)

    console.log("✅ [DOCUSIGN] Enveloppe créée:", envelope.envelopeId)

    return { envelopeId: envelope.envelopeId, signingUrls: { owner: ownerSigningUrl, tenant: tenantSigningUrl } }
  }

  async checkSignatureStatus(leaseId: string): Promise<{
    status: string
    ownerSigned: boolean
    tenantSigned: boolean
    completedDocument?: Blob
  }> {
    const { data: lease, error } = await supabase
      .from("leases")
      .select("docusign_envelope_id")
      .eq("id", leaseId)
      .single()

    if (error || !lease?.docusign_envelope_id) throw new Error("Enveloppe DocuSign non trouvée")

    const envelope = await this.getEnvelopeStatus(lease.docusign_envelope_id)

    let ownerSigned = false
    let tenantSigned = false
    let completedDocument: Blob | undefined

    const recipients = await this.makeRequest(`/envelopes/${lease.docusign_envelope_id}/recipients`)
    recipients.signers?.forEach((signer: any) => {
      if (signer.roleName === "Bailleur" && signer.status === "completed") ownerSigned = true
      if (signer.roleName === "Locataire" && signer.status === "completed") tenantSigned = true
    })

    if (envelope.status === "completed") {
      completedDocument = await this.downloadCompletedDocument(lease.docusign_envelope_id)
      await supabase.from("leases").update({
        status: "active",
        signed_by_owner: ownerSigned,
        signed_by_tenant: tenantSigned,
        owner_signature_date: ownerSigned ? new Date().toISOString() : null,
        tenant_signature_date: tenantSigned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", leaseId)
    }

    return { status: envelope.status, ownerSigned, tenantSigned, completedDocument }
  }
}

export const docuSignService = new DocuSignService()
