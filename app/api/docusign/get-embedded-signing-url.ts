import { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";

// Utilise les variables d'environnement DOCUSIGN_ACCESS_TOKEN, DOCUSIGN_ACCOUNT_ID, DOCUSIGN_RETURN_URL
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { leaseDocumentBase64, signerEmail, signerName } = req.body;

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath("https://demo.docusign.net/restapi");
  apiClient.addDefaultHeader("Authorization", "Bearer " + process.env.DOCUSIGN_ACCESS_TOKEN);

  // Création de l'enveloppe avec signataire embarqué
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = "Signature électronique du bail";
  envelopeDefinition.documents = [{
    documentBase64: leaseDocumentBase64,
    name: "Bail.pdf",
    fileExtension: "pdf",
    documentId: "1",
  }];

  // Ajoute le signataire comme "embedded" (captive)
  const signer = docusign.Signer.constructFromObject({
    email: signerEmail,
    name: signerName,
    recipientId: "1",
    routingOrder: "1",
    clientUserId: "1234", // Un identifiant arbitraire pour l'embedded signing
  });

  // Positionne l'onglet de signature (ici, signature à la page 1, x=100, y=100)
  signer.tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [
      docusign.SignHere.constructFromObject({
        anchorString: "/signature/",
        anchorYOffset: "0",
        anchorUnits: "pixels",
        anchorXOffset: "0"
      })
    ]
  });

  envelopeDefinition.recipients = docusign.Recipients.constructFromObject({
    signers: [signer]
  });
  envelopeDefinition.status = "sent";

  try {
    // Crée l'enveloppe
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const envelopeResult = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID!, { envelopeDefinition });

    // Crée la vue embarquée pour le signataire
    const recipientViewRequest = docusign.RecipientViewRequest.constructFromObject({
      authenticationMethod: "none",
      clientUserId: "1234", // doit être identique à celui du Signer
      recipientId: "1",
      returnUrl: process.env.DOCUSIGN_RETURN_URL || "https://tonsite.fr/lease/signed",
      userName: signerName,
      email: signerEmail,
    });

    const viewResult = await envelopesApi.createRecipientView(process.env.DOCUSIGN_ACCOUNT_ID!, envelopeResult.envelopeId, { recipientViewRequest });
    res.status(200).json({ embeddedSigningUrl: viewResult.url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}