"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function RefreshSessionPage() {
  const [status, setStatus] = useState<string>("Prêt")
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  const refreshSession = async () => {
    try {
      setStatus("Rafraîchissement en cours...")

      // Forcer le rafraîchissement de la session
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        setStatus(`Erreur: ${error.message}`)
        return
      }

      setStatus("Session rafraîchie avec succès!")
      setSession(data.session)

      // Attendre un peu puis rediriger
      setTimeout(() => {
        router.push("/admin/agencies")
      }, 2000)
    } catch (error) {
      setStatus(`Erreur: ${error}`)
    }
  }

  const testApiAuth = async () => {
    try {
      setStatus("Test API en cours...")
      const response = await fetch("/api/debug/auth")
      const data = await response.json()

      if (data.user) {
        setStatus(`API OK - Utilisateur: ${data.user.user_type}`)
      } else {
        setStatus(`API KO - ${data.error || "Pas d'utilisateur"}`)
      }

      console.log("API Test Result:", data)
    } catch (error) {
      setStatus(`Erreur API: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Rafraîchir la Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <strong>Status:</strong> {status}
          </div>

          <div className="text-sm">
            <strong>Session active:</strong> {session ? "Oui" : "Non"}
          </div>

          {session && (
            <div className="text-xs bg-gray-100 p-2 rounded">
              <strong>User ID:</strong> {session.user?.id}
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={refreshSession}>Rafraîchir Session</Button>
            <Button onClick={testApiAuth} variant="outline">
              Tester API
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
