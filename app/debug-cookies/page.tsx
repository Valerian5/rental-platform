"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<string[]>([])
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Récupérer tous les cookies
    const allCookies = document.cookie.split(";").map((cookie) => cookie.trim())
    setCookies(allCookies)

    // Récupérer la session Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Récupérer l'utilisateur
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const testApiAuth = async () => {
    try {
      const response = await fetch("/api/debug/auth")
      const data = await response.json()
      console.log("API Auth Test:", data)
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("Error testing API auth:", error)
      alert("Error: " + error)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Error refreshing session:", error)
        alert("Error: " + error.message)
      } else {
        console.log("Session refreshed:", data)
        alert("Session refreshed successfully")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error: " + error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Cookies & Auth</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cookies du navigateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cookies.map((cookie, index) => (
                <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {cookie}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(session, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateur Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(user, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testApiAuth} className="w-full">
              Tester API Auth
            </Button>
            <Button onClick={refreshSession} className="w-full bg-transparent" variant="outline">
              Rafraîchir Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
