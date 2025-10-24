"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Erreur lors de la vérification')
          return
        }

        if (!token || !type) {
          setStatus('error')
          setMessage('Paramètres de vérification manquants')
          return
        }

        // Vérifier l'email
        await authService.verifyEmail(token, type)
        
        setStatus('success')
        setMessage('Votre email a été vérifié avec succès !')
        toast.success('Email vérifié avec succès !')

        // Rediriger vers le dashboard approprié après 3 secondes
        setTimeout(() => {
          const userType = searchParams.get('user_type')
          if (userType === 'owner') {
            router.push('/owner/dashboard')
          } else if (userType === 'tenant') {
            router.push('/tenant/dashboard')
          } else {
            router.push('/login')
          }
        }, 3000)

      } catch (error: any) {
        console.error('Erreur vérification email:', error)
        setStatus('error')
        setMessage(error.message || 'Erreur lors de la vérification de l\'email')
        toast.error('Erreur lors de la vérification')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Vérification de l'email
            </CardTitle>
            <CardDescription>
              Confirmation de votre adresse email
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
                <p className="text-gray-600">
                  Vérification en cours...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    Email vérifié !
                  </h3>
                  <p className="text-gray-600">
                    {message}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Vous allez être redirigé automatiquement...
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/login">
                    Continuer vers la connexion
                  </Link>
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Erreur de vérification
                  </h3>
                  <p className="text-gray-600">
                    {message}
                  </p>
                </div>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/login">
                      Retour à la connexion
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/register">
                      Créer un nouveau compte
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Vérification de l'email
            </CardTitle>
            <CardDescription>
              Confirmation de votre adresse email
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
              <p className="text-gray-600">
                Chargement...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
