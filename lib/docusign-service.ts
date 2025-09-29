import jwt from "jsonwebtoken"
import { createServerClient } from "./supabase"

// --- Types ---
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
  clientUserId?: string
}

export interface DocuSignDocument {
  documentId: string
  name: string
  documentBase64?: string
  fileExtension: string
}

// --- Service ---
class DocuSignService {
  private accountId: string | null
  private baseApiUrl: string | null // e.g. https://demo.docusign.net/restapi
  private accessToken: string | null
  private tokenExpiry: number

  constructor() {
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || null
    this.baseApiUrl = process.env.DOCUSIGN_BASE_URL || null
    this.accessToken = null
    this.tokenExpiry = 0
  }

  // Choose OAuth host (demo by default)
  private getOAuthHost() {
    return process.env.DOCUSIGN_OAUTH_BASE || "account-d.docusign.com"
  }

  // --- Auth: JWT creation & token fetch ---
  private generateJWT(): string {
    const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || "").replace(/\\n/g, "\n")
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: process.env.DOCUSIGN_INTEGRATION_KEY,
      sub: process.env.DOCUSIGN_USER_ID,
      aud: this.getOAuthHost(),
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation",
    }
    return jwt.sign(payload, privateKey, { algorithm: "RS256" })
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60_000) {
      return this.accessToken
    }

    const assertion = this.generateJWT()
    const oauthHost = this.getOAuthHost()

    const res = await fetch(`https://${oauthHost}/oauth/token`, {
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

    const data = (await res.json()) as { access_token: string; expires_in: number }
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + data.expires_in * 1000

    // If baseApiUrl/accountId are not set, resolve from /userinfo
    if (!this.baseApiUrl || !this.accountId) {
      const ui = await fetch(`https://${oauthHost}/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      if (!ui.ok) {
        const text = await ui.text()
        throw new Error(`DocuSign UserInfo Error: ${ui.status} - ${text}`)
      }
      const userInfo = (await ui.json()) as any
      const account = userInfo.accounts?.find((a: any) => a.is_default) || userInfo.accounts?.[0]
      this.accountId = this.accountId || account?.account_id || null
      this.baseApiUrl = this.baseApiUrl || (account?.base_uri ? `${account.base_uri}/restapi` : null)
      if (!this.accountId || !this.baseApiUrl) {
        throw new Error("Impossible de déterminer accountId/baseApiUrl DocuSign")
      }
    }

    return this.accessToken
  }

  // --- Helpers ---
  private assertAbsoluteReturnUrl(url: string) {
    if (!url || !/^https?:\/\//i.test(url)) {
      throw new Error("NEXT_PUBLIC_SITE_URL invalide : returnUrl doit être absolu (https://...) ")
    }
  }

  private async makeRequest(endpoint: string, method = "GET", body?: any) {
    const token = await this.getAccessToken()
    const url = `${this.baseApiUrl}/v2.1/accounts/${this.accountId}${endpoint}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    }

    const init: RequestInit = { method, headers }
    if (body !== undefined && (method === "POST" || method === "PUT" || method === "PATCH")) {
      init.body = JSON.stringify(body)
    }

    const res = await fetch(url, init)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`DocuSign API Error: ${res.status} - ${text}`)
    }
    return res.json()
  }

  // --- Core API wrappers ---
  async createEnvelope(
    documents: DocuSignDocument[],
    recipients: DocuSignRecipient[],
    emailSubject: string,
    emailMessage: string,
    status: "sent" | "created" = "sent",
  ): Promise<DocuSignEnvelope> {
    const envelopeDefinition = {
      emailSubject,
      emailBlurb: emailMessage,
      documents: documents.map((d) => ({
        documentId: d.documentId,
        name: d.name,
        fileExtension: d.fileExtension,
        documentBase64: d.documentBase64,
      })),
      recipients: {
        signers: recipients.map((r) => ({
          email: r.email,
          name: r.name,
          recipientId: r.recipientId,
          routingOrder: r.routingOrder,
          roleName: r.roleName || "Signataire",
          clientUserId: r.clientUserId || r.email, // required for embedded signing
			tabs: {
			  signHereTabs: [
				{
				  anchorString: r.roleName === "Bailleur" ? "/signee_proprietaire1/" : "/signee_locataire1/",
				  anchorUnits: "pixels",
				  anchorXOffset: "0",
				  anchorYOffset: "0",
				  documentId: "1",
				},
			  ],
			  dateSignedTabs: [
				{
				  anchorString: r.roleName === "Bailleur" ? "/signee_proprietaire1/" : "/signee_locataire1/",
				  anchorUnits: "pixels",
				  anchorXOffset: "200", // décalage horizontal si tu veux la date à droite
				  anchorYOffset: "0",
				  documentId: "1",
				},
			  ],
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
    const url = `${this.baseApiUrl}/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}/documents/${documentId}`

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" } })
    if (!res.ok) throw new Error(`Erreur téléchargement document: ${res.status}`)
    return res.blob()
  }

  async createEmbeddedSigningView(
    envelopeId: string,
    recipientEmail: string,
    recipientName: string,
    returnUrl: string,
  ): Promise<string> {
    this.assertAbsoluteReturnUrl(returnUrl)
    const viewRequest = {
      returnUrl,
      authenticationMethod: "none",
      email: recipientEmail,
      userName: recipientName,
      clientUserId: recipientEmail, // must match the signer in the envelope
    }
    const res = await this.makeRequest(`/envelopes/${envelopeId}/views/recipient`, "POST", viewRequest)
    return res.url
  }

  // --- Business logic ---
  // Parallel signing (routingOrder "1" for both) since order does not matter
  async sendLeaseForSignature(
    leaseId: string,
    documentContent: string, // HTML string
    ownerEmail: string,
    ownerName: string,
    tenantEmail: string,
    tenantName: string,
  ): Promise<{ envelopeId: string; signingUrls: { owner: string; tenant: string } }> {
    console.log("📝 [DOCUSIGN] Envoi du bail pour signature (parallèle):", leaseId)

    try {
      // Vérifier l'authentification
      const token = await this.getAccessToken()
      console.log("🔑 [DOCUSIGN] Token obtenu:", token ? "✅" : "❌")
      console.log("🔑 [DOCUSIGN] AccountId:", this.accountId)
      console.log("🔑 [DOCUSIGN] BaseApiUrl:", this.baseApiUrl)

      // HTML -> base64
      const documentBase64 = Buffer.from(documentContent).toString("base64")
      console.log("📄 [DOCUSIGN] Document base64 length:", documentBase64.length)

    const documents: DocuSignDocument[] = [
      { documentId: "1", name: `Contrat de bail - ${leaseId}.html`, fileExtension: "html", documentBase64 },
    ]

    const recipients: DocuSignRecipient[] = [
      { email: ownerEmail, name: ownerName, recipientId: "1", routingOrder: "1", roleName: "Bailleur", clientUserId: ownerEmail },
      { email: tenantEmail, name: tenantName, recipientId: "2", routingOrder: "1", roleName: "Locataire", clientUserId: tenantEmail },
    ]

    console.log("📦 [DOCUSIGN] Création de l'enveloppe...")
    const envelope = await this.createEnvelope(
      documents,
      recipients,
      `Signature du contrat de bail - ${leaseId}`,
      "Veuillez signer ce contrat de bail en cliquant sur le lien ci-dessous.",
      "sent",
    )
    console.log("📦 [DOCUSIGN] Enveloppe créée:", envelope.envelopeId)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
    const returnUrl = `${siteUrl}/leases/${leaseId}?signed=true` // page neutre commune

    const ownerSigningUrl = await this.createEmbeddedSigningView(
      envelope.envelopeId,
      ownerEmail,
      ownerName,
      returnUrl,
    )
    const tenantSigningUrl = await this.createEmbeddedSigningView(
      envelope.envelopeId,
      tenantEmail,
      tenantName,
      returnUrl,
    )

    const db = createServerClient()
    await db
      .from("leases")
      .update({
        docusign_envelope_id: envelope.envelopeId,
        status: "sent_to_tenant",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId)

    console.log("✅ [DOCUSIGN] Enveloppe créée:", envelope.envelopeId)

    return { envelopeId: envelope.envelopeId, signingUrls: { owner: ownerSigningUrl, tenant: tenantSigningUrl } }
    } catch (error) {
      console.error("❌ [DOCUSIGN] Erreur lors de l'envoi:", error)
      throw error
    }
  }

  async getTenantSigningUrl(envelopeId: string, leaseId: string, tenantEmail: string, tenantName: string) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
    const returnUrl = `${siteUrl}/tenant/leases/${leaseId}?signed=true`
    return await this.createEmbeddedSigningView(envelopeId, tenantEmail, tenantName, returnUrl)
  }

  async checkSignatureStatus(leaseId: string): Promise<{
    status: string
    ownerSigned: boolean
    tenantSigned: boolean
    completedDocument?: Blob
  }> {
    const db = createServerClient()
    const { data: lease, error } = await db
      .from("leases")
      .select("id, status, docusign_envelope_id, docusign_status")
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

    // Mettre à jour le statut selon l'état des signatures
    let newStatus = lease.status
    if (ownerSigned && !tenantSigned) {
      newStatus = "signed_by_owner"
    } else if (ownerSigned && tenantSigned) {
      newStatus = "active"
    }

    // Mettre à jour la base de données si nécessaire
    const envelopeStatus = (envelope.status || "").toString()
    const shouldUpdateStatusOnly = envelopeStatus && envelopeStatus !== lease.docusign_status
    if (ownerSigned || tenantSigned || envelope.status === "completed" || shouldUpdateStatusOnly) {
      const updateData: any = {
        signed_by_owner: ownerSigned,
        signed_by_tenant: tenantSigned,
        docusign_status: envelopeStatus,
        updated_at: new Date().toISOString(),
      }

      if (ownerSigned) {
        updateData.owner_signature_date = new Date().toISOString()
      }
      if (tenantSigned) {
        updateData.tenant_signature_date = new Date().toISOString()
      }
      if (newStatus !== lease.status) {
        updateData.status = newStatus
      }

      await db
        .from("leases")
        .update(updateData)
        .eq("id", leaseId)

      console.log("✅ [DOCUSIGN] Statut mis à jour:", { newStatus, ownerSigned, tenantSigned })
    }

    if (envelope.status === "completed") {
      completedDocument = await this.downloadCompletedDocument(lease.docusign_envelope_id)
    }

    return { status: envelope.status, ownerSigned, tenantSigned, completedDocument }
  }
}

export const docuSignService = new DocuSignService()