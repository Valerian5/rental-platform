import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const consentUrl = new URL("https://account-d.docusign.com/oauth/auth")
    consentUrl.searchParams.set("response_type", "code")
    consentUrl.searchParams.set("scope", "signature impersonation")
    consentUrl.searchParams.set("client_id", process.env.DOCUSIGN_INTEGRATION_KEY || "")
    consentUrl.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_SITE_URL}/api/docusign-callback`)

    return res.redirect(consentUrl.toString())
  } catch (err: any) {
    console.error("❌ Erreur génération consent URL:", err)
    res.status(500).json({ error: "Erreur génération consent URL" })
  }
}
