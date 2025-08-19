import { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Autorise uniquement le POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { leaseDocumentBase64, signerEmail, signerName, clientUserId } = req.body;

  // Contrôle minimum des paramètres
  if (!leaseDocumentBase64 || !signerEmail || !signerName || !clientUserId) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  // Initialisation API DocuSign
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath("https://demo.docusign.net/restapi");
  apiClient.addDefaultHeader("Authorization", "Bearer " + process.env.DOCUSIGN_ACCESS_TOKEN);

  // Création de l'enveloppe
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = "Signature électronique du bail";
  envelopeDefinition.documents = [{
    documentBase64: leaseDocumentBase64,
    name: "Bail.pdf",
    fileExtension: "pdf",
    documentId: "1",
  }];

  // Définition du signataire embarqué
  const signer = new docusign.Signer();
  signer.email = signerEmail;
  signer.name = signerName;
  signer.recipientId = "1";
  signer.routingOrder = "1";
  signer.clientUserId = clientUserId; // "proprietaire" ou "locataire"

  // Onglet signature sur l'ancre /signature/ dans le PDF
  signer.tabs = new docusign.Tabs();
  signer.tabs.signHereTabs = [
    new docusign.SignHere({
      anchorString: "/signature/",
      anchorUnits: "pixels",
      anchorYOffset: "0",
      anchorXOffset: "0",
    }),
  ];

  envelopeDefinition.recipients = new docusign.Recipients();
  envelopeDefinition.recipients.signers = [signer];
  envelopeDefinition.status = "sent";

  try {
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const envelopeResult = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID!, { envelopeDefinition });

    // Prépare la vue embarquée DocuSign
    const recipientViewRequest = new docusign.RecipientViewRequest();
    recipientViewRequest.authenticationMethod = "none";
    recipientViewRequest.clientUserId = clientUserId;
    recipientViewRequest.recipientId = "1";
    recipientViewRequest.returnUrl = process.env.DOCUSIGN_RETURN_URL || "https://tonsite.fr";
    recipientViewRequest.userName = signerName;
    recipientViewRequest.email = signerEmail;

    const viewResult = await envelopesApi.createRecipientView(
      process.env.DOCUSIGN_ACCOUNT_ID!,
      envelopeResult.envelopeId,
      { recipientViewRequest }
    );
    res.status(200).json({ embeddedSigningUrl: viewResult.url });
  } catch (e: any) {
    console.error("Erreur DocuSign API:", e);
    res.status(500).json({ error: e.message || "Erreur DocuSign", details: e });
  }
}