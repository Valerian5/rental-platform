"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function DebugDBPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Récupérer quelques applications pour voir la structure
      const { data: appsData, error: appsError } = await supabase.from("applications").select("*").limit(5)

      if (appsError) {
        console.error("Erreur applications:", appsError)
      } else {
        setApplications(appsData || [])
        console.log("Structure applications:", appsData)
      }

      // Récupérer quelques propriétés
      const { data: propsData, error: propsError } = await supabase.from("properties").select("*").limit(5)

      if (propsError) {
        console.error("Erreur properties:", propsError)
      } else {
        setProperties(propsData || [])
        console.log("Structure properties:", propsData)
      }

      // Récupérer quelques utilisateurs
      const { data: usersData, error: usersError } = await supabase.from("users").select("*").limit(5)

      if (usersError) {
        console.error("Erreur users:", usersError)
      } else {
        setUsers(usersData || [])
        console.log("Structure users:", usersData)
      }
    } catch (error) {
      console.error("Erreur générale:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Base de Données</h1>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">{JSON.stringify(applications, null, 2)}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Properties ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">{JSON.stringify(properties, null, 2)}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">{JSON.stringify(users, null, 2)}</pre>
        </CardContent>
      </Card>

      <Button onClick={loadData}>Recharger</Button>
    </div>
  )
}
