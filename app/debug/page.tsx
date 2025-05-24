"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [testEmail] = useState("test@example.com")
  const [testPassword] = useState("password123")

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testSupabaseConnection = async () => {
    addLog("Test de connexion Supabase...")
    try {
      const isConnected = await authService.testConnection()
      addLog(`Connexion Supabase: ${isConnected ? "✅ OK" : "❌ Échec"}`)
    } catch (error) {
      addLog(`❌ Erreur connexion: ${error}`)
    }
  }

  const testEnvironmentVariables = () => {
    addLog("Vérification des variables d'environnement...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    addLog(`SUPABASE_URL: ${supabaseUrl ? "✅ Définie" : "❌ Manquante"}`)
    addLog(`SUPABASE_ANON_KEY: ${supabaseKey ? "✅ Définie" : "❌ Manquante"}`)

    if (supabaseUrl) {
      addLog(`URL: ${supabaseUrl.substring(0, 30)}...`)
    }
  }

  const testAuth = async () => {
    addLog("Test d'authentification...")
    try {
      // Test de connexion avec un utilisateur existant
      const { data: users } = await supabase.from("users").select("email").limit(1)
      if (users && users.length > 0) {
        addLog(`✅ Utilisateur trouvé dans la base: ${users[0].email}`)
      } else {
        addLog("❌ Aucun utilisateur dans la base")
      }

      // Test de session actuelle
      const currentUser = await authService.getCurrentUser()
      addLog(`Session actuelle: ${currentUser ? "✅ Connecté" : "❌ Non connecté"}`)

      if (currentUser) {
        addLog(`Utilisateur: ${currentUser.email} (${currentUser.user_type})`)
      }
    } catch (error) {
      addLog(`❌ Erreur test auth: ${error}`)
    }
  }

  const testLogin = async () => {
    addLog(`Test de connexion avec ${testEmail}...`)
    try {
      const result = await authService.login(testEmail, testPassword)
      addLog(`✅ Connexion réussie: ${result.user?.email}`)
    } catch (error: any) {
      addLog(`❌ Erreur connexion: ${error.message}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    testEnvironmentVariables()
    testSupabaseConnection()
    testAuth()
  }, [])

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Debug Authentification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testSupabaseConnection}>Test Connexion</Button>
            <Button onClick={testEnvironmentVariables}>Test Variables</Button>
            <Button onClick={testAuth}>Test Auth</Button>
            <Button onClick={testLogin}>Test Login</Button>
            <Button onClick={clearLogs} variant="outline">
              Effacer
            </Button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">Logs de debug:</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500">Aucun log</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
