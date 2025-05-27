"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function DebugVisitSlotsPage() {
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkTableStructure = async () => {
    setIsLoading(true)
    try {
      console.log("🔍 Vérification de la structure de la table visit_availabilities...")

      // Essayer de récupérer quelques enregistrements pour voir la structure
      const { data, error } = await supabase.from("visit_availabilities").select("*").limit(5)

      if (error) {
        console.error("❌ Erreur lors de la vérification:", error)
        setTableInfo({ error: error.message, details: error })
      } else {
        console.log("✅ Structure de la table:", data)
        setTableInfo({ success: true, data, count: data?.length || 0 })
      }
    } catch (error) {
      console.error("❌ Erreur:", error)
      setTableInfo({ error: error instanceof Error ? error.message : "Erreur inconnue" })
    } finally {
      setIsLoading(false)
    }
  }

  const testInsert = async () => {
    setIsLoading(true)
    try {
      console.log("🧪 Test d'insertion d'un créneau...")

      const testSlot = {
        property_id: "3140bdc6-8a18-4096-a96a-efad935f3735",
        date: "2025-05-28",
        start_time: "10:00",
        end_time: "10:30",
        max_capacity: 1,
        is_group_visit: false,
        current_bookings: 0,
        is_available: true,
      }

      console.log("📝 Données de test:", testSlot)

      const { data, error } = await supabase.from("visit_availabilities").insert(testSlot).select()

      if (error) {
        console.error("❌ Erreur lors du test d'insertion:", error)
        setTestResult({
          success: false,
          error: error.message,
          details: error,
          testData: testSlot,
        })
      } else {
        console.log("✅ Test d'insertion réussi:", data)
        setTestResult({
          success: true,
          data,
          testData: testSlot,
        })

        // Nettoyer le test
        if (data && data[0]?.id) {
          await supabase.from("visit_availabilities").delete().eq("id", data[0].id)
          console.log("🧹 Données de test nettoyées")
        }
      }
    } catch (error) {
      console.error("❌ Erreur:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkProperty = async () => {
    setIsLoading(true)
    try {
      console.log("🏠 Vérification de la propriété...")

      const { data, error } = await supabase
        .from("properties")
        .select("id, title, owner_id")
        .eq("id", "3140bdc6-8a18-4096-a96a-efad935f3735")
        .single()

      if (error) {
        console.error("❌ Erreur propriété:", error)
        setTestResult({ success: false, error: error.message, type: "property" })
      } else {
        console.log("✅ Propriété trouvée:", data)
        setTestResult({ success: true, data, type: "property" })
      }
    } catch (error) {
      console.error("❌ Erreur:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        type: "property",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug Visit Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkTableStructure} disabled={isLoading}>
              Vérifier la table
            </Button>
            <Button onClick={checkProperty} disabled={isLoading}>
              Vérifier la propriété
            </Button>
            <Button onClick={testInsert} disabled={isLoading}>
              Test d'insertion
            </Button>
          </div>

          {tableInfo && (
            <Card>
              <CardHeader>
                <CardTitle>📋 Informations de la table</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">{JSON.stringify(tableInfo, null, 2)}</pre>
              </CardContent>
            </Card>
          )}

          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle>🧪 Résultat du test</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
