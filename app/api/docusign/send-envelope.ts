import { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { leaseDocumentBase64, tenantEmail, landlordEmail } = req.body;

  // Configure DocuSign API client
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath("https://demo.docusign.net/restapi");
  apiClient.addDefaultHeader("Authorization", "Bearer " + process.env.DOCUSIGN_ACCESS_TOKEN);

  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  // Crée l'enveloppe (demande de signature)
  const envDef = new docusign.EnvelopeDefinition();
  envDef.emailSubject = "Veuillez signer votre bail de location";
  envDef.documents = [
    {
      documentBase64: leaseDocumentBase64,
      name: "Bail.pdf",
      fileExtension: "pdf",
      documentId: "1",
    },
  ];
  envDef.recipients = {
    signers: [
      { email: tenantEmail, name: "Locataire", recipientId: "1", routingOrder: "1" },
      { email: landlordEmail, name: "Propriétaire", recipientId: "2", routingOrder: "2" }
    ],
  };
  envDef.status = "sent"; // envoie immédiatement

  try {
    const results = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID!, { envelopeDefinition: envDef });
    res.status(200).json({ envelopeId: results.envelopeId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}