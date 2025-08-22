import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import xml2js from "xml2js"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Vérif rapide que ça vient bien de DocuSign
    if (!rawBody.includes("<DocuSignEnvelopeInformation")) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Parse XML
    const parsed = await xml2js.parseStringPromise(rawBody, { explicitArray: false })

    const envelopeInfo = parsed.DocuSignEnvelopeInformation.EnvelopeStatus
    const envelopeId = envelopeInfo.EnvelopeID
    const status = envelopeInfo.Status // "Completed", "Declined", "Voided", etc.

    console.log("📩 [DOCUSIGN-WEBHOOK] envelopeId:", envelopeId, "status:", status)

    // Update dans Supabase
    if (envelopeId) {
      const { error } = await supabase
        .from("leases")
        .update({
          status: status.toLowerCase() === "completed" ? "signed" : status.toLowerCase(),
        })
        .eq("docusign_envelope_id", envelopeId)

      if (error) {
        console.error("❌ [DOCUSIGN-WEBHOOK] Erreur Supabase:", error)
        return NextResponse.json({ error: "DB update failed" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("❌ [DOCUSIGN-WEBHOOK]", err)
    return NextResponse.json({ error: err.message ?? "Erreur serveur" }, { status: 500 })
  }
}
