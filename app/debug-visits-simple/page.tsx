"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

export default function DebugVisitsSimplePage() {
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const checkTable = async () => {
    setLoading(true)
    try {
      // Vérifier la structure de la table visits
      const { data: columns, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "visits")
        .order("ordinal_position")

      if (columnsError) {
        console.error("Erreur colonnes:", columnsError)
      } else {
        setTableInfo(columns)
      }

      // Récupérer quelques visites pour test
      const { data: visitsData, error: visitsError } = await supabase.from("visits").select("*").limit(5)

      if (visitsError) {
        console.error("Erreur visites:", visitsError)
      } else {
        setVisits(visitsData || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const testInsert = async () => {
    try {
      const testData = {
        property_id: "test-property-id",
        tenant_id: "test-tenant-id",
        visite_date: "2025-01-15",
        status: "scheduled",
        notes: "Test d'insertion",
        application_id: "test-application-id",
      }

      const { data, error } = await supabase.from("visits").insert(testData).select().single()

      if (error) {
        console.error("❌ Erreur test insert:", error)
        alert(`Erreur: ${error.message}`)
      } else {
        console.log("✅ Test insert réussi:", data)
        alert("Test d'insertion réussi !")
        checkTable() // Recharger
      }
    } catch (error) {
      console.error("Erreur test:", error)
      alert("Erreur lors du test")
    }
  }

  useEffect(() => {
    checkTable()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Diagnostic table visits</h1>
          <p className="text-muted-foreground">Vérification de la structure existante</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkTable} disabled={loading}>
            {loading ? "Vérification..." : "Actualiser"}
          </Button>
          <Button onClick={testInsert} variant="outline">
            Test insertion
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Structure de la table */}
        <Card>
          <CardHeader>
            <CardTitle>Structure de la table visits</CardTitle>
          </CardHeader>
          <CardContent>
            {tableInfo ? (
              <div className="space-y-2">
                {tableInfo.map((col: any) => (
                  <div key={col.column_name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{col.column_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {col.data_type}
                      </Badge>
                      {col.is_nullable === "NO" && (
                        <Badge variant="secondary" className="text-xs">
                          NOT NULL
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Chargement...</p>
            )}
          </CardContent>
        </Card>

        {/* Données existantes */}
        <Card>
          <CardHeader>
            <CardTitle>Visites existantes ({visits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length > 0 ? (
              <div className="space-y-2">
                {visits.map((visit) => (
                  <div key={visit.id} className="p-3 border rounded">
                    <div className="text-sm">
                      <strong>ID:</strong> {visit.id}
                    </div>
                    <div className="text-sm">
                      <strong>Date:</strong> {visit.visite_date || visit.visit_date || "Non définie"}
                    </div>
                    <div className="text-sm">
                      <strong>Statut:</strong> {visit.status}
                    </div>
                    {visit.notes && (
                      <div className="text-sm">
                        <strong>Notes:</strong> {visit.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune visite trouvée</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
