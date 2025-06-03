"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPDFDependencies() {
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testDependencies = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/pdf/test-dependencies")
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testPDFExtraction = async () => {
    setLoading(true)
    try {
      // Utiliser un PDF de test simple
      const testPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

      const response = await fetch("/api/pdf/extract-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pdfUrl: testPdfUrl }),
      })

      const result = await response.json()
      setTestResult({ extractionTest: result })
    } catch (error) {
      setTestResult({ extractionError: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug PDF Dependencies</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test des dépendances PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testDependencies} disabled={loading}>
              {loading ? "Test en cours..." : "Tester les dépendances"}
            </Button>

            <Button onClick={testPDFExtraction} disabled={loading}>
              {loading ? "Test en cours..." : "Tester l'extraction PDF"}
            </Button>

            {testResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Résultats :</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
