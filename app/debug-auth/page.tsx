"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"

export default function DebugAuthPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [supabaseSession, setSupabaseSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log("🔍 Debug Auth - Début vérification...")

      // 1. Vérifier la session Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log("📋 Session Supabase:", { sessionData, sessionError })
      setSupabaseSession(sessionData)

      // 2. Vérifier l'utilisateur Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser()
      console.log("👤 Utilisateur Supabase:", { userData, userError })

      // 3. Utiliser notre service auth
      const currentUser = await authService.getCurrentUser()
      console.log("🔐 Service Auth:", currentUser)
      setUserProfile(currentUser)

      // 4. Si on a un utilisateur, récupérer son profil directement
      if (userData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userData.user.id)
          .single()

        console.log("📊 Profil direct:", { profile, profileError })
        setAuthData({ user: userData.user, profile, profileError })
      }
    } catch (err) {
      console.error("❌ Erreur debug auth:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  const testLogin = async () => {
    try {
      // Test avec un compte existant (remplacez par vos vraies données)
      const result = await authService.login("valerian.joubert@gmail.com", "M7g75re51")
      console.log("✅ Test login réussi:", result)
      await checkAuth()
    } catch (err) {
      console.error("❌ Test login échoué:", err)
      setError(err instanceof Error ? err.message : "Erreur de connexion")
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      console.log("✅ Déconnexion réussie")
      setAuthData(null)
      setUserProfile(null)
      setSupabaseSession(null)
    } catch (err) {
      console.error("❌ Erreur déconnexion:", err)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug Authentification</h1>

      <div className="flex gap-4">
        <Button onClick={checkAuth}>Vérifier Auth</Button>
        <Button onClick={testLogin} variant="outline">
          Test Login
        </Button>
        <Button onClick={logout} variant="destructive">
          Déconnexion
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(supabaseSession, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Données Auth</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(authData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profil Utilisateur (Service)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(userProfile, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations de Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Session active:</strong> {supabaseSession?.session ? "✅ Oui" : "❌ Non"}
            </div>
            <div>
              <strong>Utilisateur connecté:</strong> {authData?.user ? "✅ Oui" : "❌ Non"}
            </div>
            <div>
              <strong>Profil trouvé:</strong> {authData?.profile ? "✅ Oui" : "❌ Non"}
            </div>
            <div>
              <strong>Type utilisateur:</strong> {authData?.profile?.user_type || "Non défini"}
            </div>
            <div>
              <strong>Service Auth OK:</strong> {userProfile ? "✅ Oui" : "❌ Non"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
