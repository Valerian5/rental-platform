import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query

  if (error) {
    console.error("❌ Consentement refusé:", error)
    return res.status(400).send("Consentement refusé")
  }

  if (!code) {
    return res.status(400).send("Code manquant")
  }

  // Ici, on n’a pas besoin d’échanger le code contre un token,
  // car notre service utilise le JWT flow (pas le code grant flow).
  // On se contente d’informer l’utilisateur que le consentement est accordé.

  return res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1>DocuSign</h1>
        <p>✅ Consentement accordé. Vous pouvez revenir à l'application.</p>
      </body>
    </html>
  `)
}
