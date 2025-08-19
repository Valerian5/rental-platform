import jwt from "jsonwebtoken"

interface TokenCache {
  accessToken: string | null
  expiry: number | null
}

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
  private tokenCache: TokenCache

  constructor() {
    this.baseUrl = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi"
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || ""
    this.tokenCache = { accessToken: null, expiry: null }
  }

  private async generateJWT(): Promise<string> {
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || ""
    const userId = process.env.DOCUSIGN_USER_ID || ""

    // 🔑 On reconstitue la clé privée en respectant les sauts de ligne
    const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || "").replace(/\\n/g, "\n")

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: integrationKey,
      sub: userId,
      aud: "account-d.docusign.com",
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation",
    }

    return jwt.sign(payload, privateKey, { algorithm: "RS256" })
  }

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache.accessToken && this.tokenCache.expiry && Date.now() < this.tokenCache.expiry) {
      return this.tokenCache.accessToken
    }

    const assertion = await this.generateJWT()

    const response = await fetch("https://account-d.docusign.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erreur récupération token DocuSign: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    this.tokenCache.accessToken = data.access_token
    this.tokenCache.expiry = Date.now() + data.expires_in * 1000

    return this.tokenCache.accessToken
  }

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
}

export const docuSignService = new DocuSignService()
