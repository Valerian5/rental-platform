"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function DebugPropertyPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAuth = async () => {
    try {
      addLog("🔍 Test de l'authentification...")
      const user = await authService.getCurrentUser()
      addLog(`✅ Utilisateur connecté: ${JSON.stringify(user)}`)
    } catch (error) {
      addLog(`❌ Erreur auth: ${error.message}`)
    }
  }

  const testPropertyCreation = async () => {
    setIsLoading(true)
    try {
      addLog("🏠 Test de création de propriété...")

      const user = await authService.getCurrentUser()
      if (!user) {
        addLog("❌ Pas d'utilisateur connecté")
        return
      }

      const testData = {
        title: "Test Property",
        description: "Test description",
        address: "123 Test Street",
        city: "Test City",
        postal_code: "12345",
        hide_exact_address: false,
        surface: 50,
        rent_excluding_charges: 1000,
        charges_amount: 100,
        property_type: "apartment" as const,
        rental_type: "unfurnished" as const,
        construction_year: 2020,
        security_deposit: 1000,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        exterior_type: "balcon",
        equipment: ["Cuisine équipée"],
        energy_class: "C",
        ges_class: "C",
        heating_type: "individual_electric",
        required_income: 3000,
        professional_situation: "CDI",
        guarantor_required: false,
        lease_duration: 12,
        move_in_date: "2024-02-01",
        rent_payment_day: 5,
        owner_id: user.id,
      }

      addLog(`📝 Données de test: ${JSON.stringify(testData, null, 2)}`)

      const result = await propertyService.createProperty(testData)
      addLog(`✅ Propriété créée: ${JSON.stringify(result)}`)

      toast.success("Test réussi !")
    } catch (error) {
      addLog(`❌ Erreur création: ${error.message}`)
      addLog(`❌ Stack: ${error.stack}`)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testAPI = async () => {
    try {
      addLog("🌐 Test de l'API directe...")

      const response = await fetch("/api/properties", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      addLog(`📡 Status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        addLog(`✅ API Response: ${JSON.stringify(data)}`)
      } else {
        const error = await response.text()
        addLog(`❌ API Error: ${error}`)
      }
    } catch (error) {
      addLog(`❌ Fetch Error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Debug Property Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testAuth}>Test Auth</Button>
            <Button onClick={testAPI}>Test API</Button>
            <Button onClick={testPropertyCreation} disabled={isLoading}>
              {isLoading ? "Testing..." : "Test Property Creation"}
            </Button>
            <Button variant="outline" onClick={() => setLogs([])}>
              Clear Logs
            </Button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">Logs:</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500">Aucun log pour le moment...</p>
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
