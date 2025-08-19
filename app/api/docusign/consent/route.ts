// /app/api/docusign/consent/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function getAuthHost() {
  const env = process.env.DOCUSIGN_ENV?.toLowerCase() || "demo"
  return env === "production" ? "account.docusign.com" : "account-d.docusign.com"
}

// Redirect the user to DocuSign to grant consent (one-time)
export async function GET(req: NextRequest) {
  const clientId = process.env.DOCUSIGN_INTEGRATION_KEY
  const redirectUri = process.env.DOCUSIGN_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing DOCUSIGN_INTEGRATION_KEY or DOCUSIGN_REDIRECT_URI env vars" },
      { status: 500 }
    )
  }

  const authHost = getAuthHost()
  const scopes = encodeURIComponent("signature impersonation")

  const url = new URL(`https://${authHost}/oauth/auth`)
  url.searchParams.set("response_type", "code") // we only need consent; code can be ignored for JWT
  url.searchParams.set("scope", "signature impersonation")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)

  return NextResponse.redirect(url.toString())
}
