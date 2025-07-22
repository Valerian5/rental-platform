"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [logos, setLogos] = useState(null)
  const [siteInfo, setSiteInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAllSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/settings")
      const result = await response.json()
      console.log("All settings:", result)
      setSettings(result)
    } catch (error) {
      console.error("Error fetching all settings:", error)
    }
    setLoading(false)
  }

  const fetchLogos = async () => {
    try {
      const response = await fetch("/api/admin/settings?key=logos")
      const result = await response.json()
      console.log("Logos:", result)
      setLogos(result)
    } catch (error) {
      console.error("Error fetching logos:", error)
    }
  }

  const fetchSiteInfo = async () => {
    try {
      const response = await fetch("/api/admin/settings?key=site_info")
      const result = await response.json()
      console.log("Site info:", result)
      setSiteInfo(result)
    } catch (error) {
      console.error("Error fetching site info:", error)
    }
  }

  const insertTestLogo = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "logos",
          value: {
            main: "https://ttetnxacihuszvcscbtl.supabase.co/storage/v1/object/public/logos/admin/main_1753125875568.png",
          },
        }),
      })
      const result = await response.json()
      console.log("Insert logo result:", result)
      alert("Logo inséré ! Vérifiez la console.")
    } catch (error) {
      console.error("Error inserting logo:", error)
    }
  }

  useEffect(() => {
    fetchAllSettings()
    fetchLogos()
    fetchSiteInfo()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Settings</h1>

      <div className="flex gap-4">
        <Button onClick={fetchAllSettings} disabled={loading}>
          Refresh All Settings
        </Button>
        <Button onClick={fetchLogos}>Refresh Logos</Button>
        <Button onClick={fetchSiteInfo}>Refresh Site Info</Button>
        <Button onClick={insertTestLogo} variant="outline">
          Insert Test Logo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(settings, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logos</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(logos, null, 2)}</pre>
            {logos?.success && logos.data?.main && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Logo Preview:</p>
                <img
                  src={logos.data.main || "/placeholder.svg"}
                  alt="Logo"
                  className="max-h-16 object-contain border"
                  onError={(e) => console.error("Logo load error:", e)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Site Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(siteInfo, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
