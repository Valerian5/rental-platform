import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { XMLParser } from "fast-xml-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log("📩 Webhook DocuSign:", body);

    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(body);

    const envelope = json?.DocuSignEnvelopeInformation?.EnvelopeStatus;
    const envelopeId = envelope?.EnvelopeID;
    const envelopeStatus = envelope?.Status;

    if (!envelopeId || !envelopeStatus) {
      console.warn("❌ Webhook sans EnvelopeID ou Status");
      return NextResponse.json({ ok: false });
    }

    // Récupère la liste des destinataires
    let recipients = envelope?.RecipientStatuses?.RecipientStatus || [];
    if (!Array.isArray(recipients)) recipients = [recipients]; // normaliser en tableau

    const supabase = createServerClient();

    // Construire un objet avec les statuts par signataire
    const signatures: Record<string, any> = {};
    for (const r of recipients) {
      signatures[r.Email] = {
        status: r.Status, // Sent, Delivered, Completed, Declined...
        signed_at: r.Signed || null,
      };
    }

    // Mise à jour du bail
    const { error } = await supabase
      .from("leases")
      .update({
        signature_status: envelopeStatus.toLowerCase(),
        signed_at: envelopeStatus === "Completed" ? new Date().toISOString() : null,
        signatures_detail: signatures, // JSONB dans ta table leases
      })
      .eq("docusign_envelope_id", envelopeId);

    if (error) {
      console.error("❌ Erreur update lease:", error);
    } else {
      console.log(`✅ Lease mis à jour (envelope: ${envelopeId}, status: ${envelopeStatus})`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Erreur webhook:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
