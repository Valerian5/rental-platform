// /app/api/docusign/callback/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function getAuthHost() {
  const env = process.env.DOCUSIGN_ENV?.toLowerCase() || "demo"
  return env === "production" ? "account.docusign.com" : "account-d.docusign.com"
}

// This route is called by DocuSign after the user grants consent.
// If you use JWT, you can ignore the ?code=... and just show a success message.
// If you use Authorization Code Grant, exchange the code for tokens here.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return new NextResponse(
      `<h1>DocuSign - Erreur</h1><p>${error}</p>`,
      { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  }

  // If you're using JWT grant, you can just say "consent granted"
  if (!process.env.DOCUSIGN_SECRET) {
    return new NextResponse(
      `<h1>DocuSign</h1><p>✅ Consentement accordé. Vous pouvez revenir à l'application.</p>`,
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  }

  // Optional: Authorization Code Grant (confidential app)
  if (!code) {
    return new NextResponse(
      `<h1>DocuSign</h1><p>Consentement accordé. (Pas de code fourni)</p>`,
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  }

  const clientId = process.env.DOCUSIGN_INTEGRATION_KEY!
  const clientSecret = process.env.DOCUSIGN_SECRET!
  const redirectUri = process.env.DOCUSIGN_REDIRECT_URI!
  const authHost = getAuthHost()

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch(`https://${authHost}/oauth/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    }).toString()
  })

  const json = await res.json()
  if (!res.ok) {
    return new NextResponse(
      `<h1>DocuSign - Erreur d'échange de code</h1><pre>${JSON.stringify(json, null, 2)}</pre>`,
      { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  }

  // You would normally store tokens server-side (DB/kv). For demo we just display them.
  return new NextResponse(
    `<h1>DocuSign - Tokens reçus</h1><pre>${JSON.stringify(json, null, 2)}</pre>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
  )
}
