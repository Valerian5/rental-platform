"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<string[]>([])
  const [apiResult, setApiResult] = useState<any>(null)

  useEffect(() => {
    // Récupérer tous les cookies côté client
    const allCookies = document.cookie.split(";").map((cookie) => cookie.trim())
    setCookies(allCookies)
  }, [])

  const testApiAuth = async () => {
    try {
      const response = await fetch("/api/debug/auth")
      const result = await response.json()
      setApiResult(result)
      console.log("API Auth test:", result)
    } catch (error) {
      console.error("Error testing API auth:", error)
      setApiResult({ error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Debug Cookies</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cookies côté client</CardTitle>
            <CardDescription>Tous les cookies disponibles dans le navigateur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cookies.length > 0 ? (
                cookies.map((cookie, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded text-sm">
                    {cookie}
                  </div>
                ))
              ) : (
                <p>Aucun cookie trouvé</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test API Authentication</CardTitle>
            <CardDescription>Tester l'authentification côté serveur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testApiAuth}>Tester API Auth</Button>
              {apiResult && (
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
