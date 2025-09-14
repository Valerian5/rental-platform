"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth-service"

export default function DebugAdminAuthPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Erreur auth:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserToAdmin = async () => {
    if (!user) {
      alert('Aucun utilisateur connecté')
      return
    }
    
    try {
      const response = await fetch('/api/debug/update-user-to-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      })
      const result = await response.json()
      console.log('Résultat mise à jour:', result)
      alert(result.message)
      // Recharger la page pour voir les changements
      window.location.reload()
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Authentification Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-2">
              <p><strong>Utilisateur connecté:</strong> {user.email}</p>
              <p><strong>Type d'utilisateur:</strong> {user.user_type}</p>
              <p><strong>Prénom:</strong> {user.first_name}</p>
              <p><strong>Nom:</strong> {user.last_name}</p>
              <p><strong>Actif:</strong> {user.is_active ? 'Oui' : 'Non'}</p>
              <p><strong>ID:</strong> {user.id}</p>
              
              {user.user_type === 'admin' ? (
                <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-800 font-medium">✅ Vous êtes admin! Vous pouvez accéder à la page des modèles.</p>
                  <Button 
                    onClick={() => window.location.href = '/admin/etat-des-lieux-templates'}
                    className="mt-2"
                  >
                    Aller à la page des modèles
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-800 font-medium">❌ Vous n'êtes pas admin. Type: {user.user_type}</p>
                  <Button 
                    onClick={updateUserToAdmin}
                    className="mt-2"
                    variant="outline"
                  >
                    Me donner les droits admin
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 font-medium">❌ Aucun utilisateur connecté</p>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="mt-2"
              >
                Se connecter
              </Button>
            </div>
          )}
          
          <Button onClick={checkAuth} variant="outline">
            Actualiser
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}