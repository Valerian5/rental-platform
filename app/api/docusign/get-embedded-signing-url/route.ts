import { NextRequest } from "next/server";
import docusign from "docusign-esign";

export async function POST(req: NextRequest) {
  try {
    // Récupère les données du body
    const { leaseDocumentBase64, signerEmail, signerName, clientUserId } = await req.json();

    // Vérification des paramètres
    if (!leaseDocumentBase64 || !signerEmail || !signerName || !clientUserId) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), { status: 400 });
    }

    // Initialisation DocuSign
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath(process.env.DOCUSIGN_BASE_URI || "https://demo.docusign.net/restapi");
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
    signer.clientUserId = clientUserId;

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

    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const envelopeResult = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID!, { envelopeDefinition });

    // Vue embarquée DocuSign
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

    return new Response(JSON.stringify({ embeddedSigningUrl: viewResult.url }), { status: 200 });
  } catch (e: any) {
    console.error("Erreur DocuSign API:", e);
    return new Response(JSON.stringify({ error: e.message || "Erreur DocuSign", details: e }), { status: 500 });
  }
}

// Optionnel : la méthode GET renvoie 405
export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}