"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/lib/auth-service"

export default function DebugAdminAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      console.log("Current user:", currentUser)
    } catch (error) {
      console.error("Error getting current user:", error)
    }
  }

  const testApiAuth = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/auth")
      const result = await response.json()
      setDebugInfo(result)
      console.log("API Auth test:", result)
    } catch (error) {
      console.error("Error testing API auth:", error)
      setDebugInfo({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  const testAgenciesApi = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/agencies")
      const result = await response.json()
      console.log("Agencies API test:", result)
      setDebugInfo({ ...debugInfo, agenciesTest: result })
    } catch (error) {
      console.error("Error testing agencies API:", error)
      setDebugInfo({ ...debugInfo, agenciesError: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Debug Admin Authentication</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current User (Client Side)</CardTitle>
            <CardDescription>User retrieved from client-side auth service</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(user, null, 2)}</pre>
            <Button onClick={checkCurrentUser} className="mt-4">
              Refresh User
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Authentication Test</CardTitle>
            <CardDescription>Test server-side authentication in API routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testApiAuth} disabled={loading}>
                Test API Auth
              </Button>
              <Button onClick={testAgenciesApi} disabled={loading}>
                Test Agencies API
              </Button>
              {debugInfo && (
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
