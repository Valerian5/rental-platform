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
  private accessToken: string

  constructor() {
    this.baseUrl = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi"
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || ""
    this.accessToken = process.env.DOCUSIGN_ACCESS_TOKEN || ""
  }

  private async makeRequest(endpoint: string, method = "GET", body?: any) {
    const url = `${this.baseUrl}/v2.1/accounts/${this.accountId}${endpoint}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    const config: RequestInit = {
      method,
      headers,
    }

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
          tabs: {
            signHereTabs: [
              {
                documentId: "1",
                pageNumber: "1",
                xPosition: "100",
                yPosition: "100",
              },
            ],
            dateSignedTabs: [
              {
                documentId: "1",
                pageNumber: "1",
                xPosition: "300",
                yPosition: "100",
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
    const url = `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}/documents/${documentId}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/pdf",
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur téléchargement document: ${response.status}`)
    }

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

  async sendLeaseForSignature(
    leaseId: string,
    documentContent: string,
    ownerEmail: string,
    ownerName: string,
    tenantEmail: string,
    tenantName: string,
  ): Promise<{ envelopeId: string; signingUrls: { owner: string; tenant: string } }> {
    try {
      console.log("📝 [DOCUSIGN] Envoi du bail pour signature:", leaseId)

      // Convertir le HTML en base64
      const documentBase64 = Buffer.from(documentContent).toString("base64")

      // Créer les documents
      const documents: DocuSignDocument[] = [
        {
          documentId: "1",
          name: `Contrat de bail - ${leaseId}`,
          fileExtension: "html",
          documentBase64,
        },
      ]

      // Créer les destinataires
      const recipients: DocuSignRecipient[] = [
        {
          email: ownerEmail,
          name: ownerName,
          recipientId: "1",
          routingOrder: "1",
          roleName: "Bailleur",
        },
        {
          email: tenantEmail,
          name: tenantName,
          recipientId: "2",
          routingOrder: "2",
          roleName: "Locataire",
        },
      ]

      // Créer l'enveloppe
      const envelope = await this.createEnvelope(
        documents,
        recipients,
        `Signature du contrat de bail - ${leaseId}`,
        "Veuillez signer ce contrat de bail en cliquant sur le lien ci-dessous.",
        "sent",
      )

      // Créer les URLs de signature intégrée
      const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/owner/leases/${leaseId}?signed=true`

      const ownerSigningUrl = await this.createEmbeddedSigningView(envelope.envelopeId, ownerEmail, returnUrl)

      const tenantSigningUrl = await this.createEmbeddedSigningView(envelope.envelopeId, tenantEmail, returnUrl)

      // Sauvegarder l'ID de l'enveloppe dans la base de données
      await supabase
        .from("leases")
        .update({
          docusign_envelope_id: envelope.envelopeId,
          status: "sent_for_signature",
          updated_at: new Date().toISOString(),
        })
        .eq("id", leaseId)

      console.log("✅ [DOCUSIGN] Enveloppe créée:", envelope.envelopeId)

      return {
        envelopeId: envelope.envelopeId,
        signingUrls: {
          owner: ownerSigningUrl,
          tenant: tenantSigningUrl,
        },
      }
    } catch (error) {
      console.error("❌ [DOCUSIGN] Erreur envoi signature:", error)
      throw error
    }
  }

  async checkSignatureStatus(leaseId: string): Promise<{
    status: string
    ownerSigned: boolean
    tenantSigned: boolean
    completedDocument?: Blob
  }> {
    try {
      // Récupérer l'ID de l'enveloppe depuis la base de données
      const { data: lease, error } = await supabase
        .from("leases")
        .select("docusign_envelope_id")
        .eq("id", leaseId)
        .single()

      if (error || !lease?.docusign_envelope_id) {
        throw new Error("Enveloppe DocuSign non trouvée")
      }

      // Vérifier le statut de l'enveloppe
      const envelope = await this.getEnvelopeStatus(lease.docusign_envelope_id)

      let ownerSigned = false
      let tenantSigned = false
      let completedDocument: Blob | undefined

      // Vérifier les signatures individuelles
      const recipients = await this.makeRequest(`/envelopes/${lease.docusign_envelope_id}/recipients`)

      recipients.signers?.forEach((signer: any) => {
        if (signer.roleName === "Bailleur" && signer.status === "completed") {
          ownerSigned = true
        }
        if (signer.roleName === "Locataire" && signer.status === "completed") {
          tenantSigned = true
        }
      })

      // Si tout est signé, télécharger le document
      if (envelope.status === "completed") {
        completedDocument = await this.downloadCompletedDocument(lease.docusign_envelope_id)

        // Mettre à jour le statut du bail
        await supabase
          .from("leases")
          .update({
            status: "active",
            signed_by_owner: ownerSigned,
            signed_by_tenant: tenantSigned,
            owner_signature_date: ownerSigned ? new Date().toISOString() : null,
            tenant_signature_date: tenantSigned ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", leaseId)
      }

      return {
        status: envelope.status,
        ownerSigned,
        tenantSigned,
        completedDocument,
      }
    } catch (error) {
      console.error("❌ [DOCUSIGN] Erreur vérification statut:", error)
      throw error
    }
  }
}

export const docuSignService = new DocuSignService()
