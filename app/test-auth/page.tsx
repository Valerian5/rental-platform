"use client"

import { useEffect, useState } from "react"
import { authService } from "@/lib/auth-service"

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        console.log("🧪 Test Auth - Utilisateur:", currentUser)
        setUser(currentUser)
      } catch (error) {
        console.log("🧪 Test Auth - Erreur:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test d'authentification</h1>

      {user ? (
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold text-green-800">✅ Utilisateur connecté</h2>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Type:</strong> {user.user_type}
          </p>
          <p>
            <strong>Nom:</strong> {user.first_name} {user.last_name}
          </p>

          <div className="mt-4">
            <a href="/owner/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
              Aller au dashboard propriétaire
            </a>
            <a href="/tenant/dashboard" className="bg-green-500 text-white px-4 py-2 rounded">
              Aller au dashboard locataire
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="text-lg font-semibold text-red-800">❌ Pas d'utilisateur connecté</h2>
          <a href="/login" className="bg-blue-500 text-white px-4 py-2 rounded mt-2 inline-block">
            Se connecter
          </a>
        </div>
      )}
    </div>
  )
}
