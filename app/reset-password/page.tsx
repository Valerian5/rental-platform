"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Image from "next/image"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // Récupérer le logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/public/logo')
        if (response.ok) {
          const data = await response.json()
          setLogoUrl(data.logoUrl)
        }
      } catch (error) {
        console.warn('Erreur récupération logo:', error)
      }
    }
    fetchLogo()
  }, [])

  // Vérifier si on a les paramètres de réinitialisation
  useEffect(() => {
    // Debug: afficher tous les paramètres de l'URL
    console.log("🔍 Paramètres URL:", {
      token: searchParams.get('token'),
      type: searchParams.get('type'),
      access_token: searchParams.get('access_token'),
      refresh_token: searchParams.get('refresh_token'),
      email: searchParams.get('email'),
      allParams: Object.fromEntries(searchParams.entries())
    })
    
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const email = searchParams.get('email')
    
    // Accepter soit les paramètres Supabase Auth soit les tokens ou l'email
    if (!token && !accessToken && !email) {
      console.log("❌ Aucun paramètre de réinitialisation trouvé")
      toast.error("Lien de réinitialisation invalide")
      router.push('/forgot-password')
    } else {
      console.log("✅ Paramètres de réinitialisation trouvés")
    }
  }, [searchParams, router])

  // Vérifier la force du mot de passe
  const validatePassword = (password: string) => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push("Au moins 8 caractères")
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Au moins une majuscule")
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Au moins une minuscule")
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Au moins un chiffre")
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Au moins un caractère spécial")
    }
    
    return errors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    if (name === "password") {
      const errors = validatePassword(value)
      setPasswordErrors(errors)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    if (passwordErrors.length > 0) {
      toast.error("Le mot de passe ne respecte pas les critères requis")
      return
    }

    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Vérifier si nous avons un token d'accès (utilisateur connecté)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Utilisateur connecté via le lien de réinitialisation
        console.log("🔄 Réinitialisation avec session active")
        const { error } = await supabase.auth.updateUser({
          password: formData.password
        })

        if (error) {
          throw new Error(error.message)
        }
      } else {
        // Pas de session, essayer de récupérer l'email depuis l'URL
        const email = searchParams.get('email')
        if (!email) {
          throw new Error("Email manquant pour la réinitialisation")
        }
        
        console.log("🔄 Réinitialisation avec email:", email)
        
        // Créer une API pour gérer la réinitialisation sans session
        const response = await fetch('/api/auth/reset-password-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            newPassword: formData.password
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de la réinitialisation')
        }
      }

      setPasswordReset(true)
      toast.success("Mot de passe réinitialisé avec succès !")
      
      // Rediriger vers la connexion après 3 secondes
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error: any) {
      console.error("Erreur réinitialisation mot de passe:", error)
      toast.error(error.message || "Erreur lors de la réinitialisation")
    } finally {
      setIsLoading(false)
    }
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Mot de passe réinitialisé !
              </h1>
              
              <p className="text-gray-600 mb-6">
                Votre mot de passe a été mis à jour avec succès. 
                Vous allez être redirigé vers la page de connexion.
              </p>
              
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Se connecter maintenant
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-500">
                  Redirection automatique dans quelques secondes...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex min-h-screen">
        {/* Section gauche - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <div className="mb-8">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={120}
                  height={120}
                  className="mb-6"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <Lock className="h-10 w-10 text-white" />
                </div>
              )}
              <h1 className="text-4xl font-bold text-white mb-4">
                Nouveau mot de passe
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Choisissez un mot de passe fort et sécurisé pour protéger votre compte.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <span>Au moins 8 caractères</span>
              </div>
              
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <span>Majuscules et minuscules</span>
              </div>
              
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <span>Chiffres et caractères spéciaux</span>
              </div>
            </div>
          </div>
          
          {/* Formes décoratives */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Header mobile */}
            <div className="lg:hidden mb-8 text-center">
              <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à la connexion
              </Link>
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="mx-auto mb-4"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
              <p className="text-gray-600 mt-2">Choisissez un mot de passe sécurisé</p>
            </div>

            {/* Header desktop */}
            <div className="hidden lg:block mb-8">
              <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à la connexion
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Nouveau mot de passe</h1>
              <p className="text-gray-600 mt-2">Choisissez un mot de passe sécurisé</p>
            </div>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Nouveau mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Votre nouveau mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </Button>
                    </div>
                    
                    {/* Critères de mot de passe */}
                    {formData.password && (
                      <div className="space-y-1">
                        {passwordErrors.length > 0 ? (
                          <div className="text-sm text-red-600">
                            <p className="font-medium mb-1">Critères manquants :</p>
                            <ul className="list-disc list-inside space-y-1">
                              {passwordErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Mot de passe conforme
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmez votre nouveau mot de passe"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </Button>
                    </div>
                    
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <div className="text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Les mots de passe ne correspondent pas
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    disabled={isLoading || passwordErrors.length > 0 || formData.password !== formData.confirmPassword}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Réinitialisation en cours...</span>
                      </div>
                    ) : (
                      "Réinitialiser le mot de passe"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Vous vous souvenez de votre mot de passe ?{" "}
                      <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                        Se connecter
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Chargement...
            </h1>
            <p className="text-gray-600">
              Préparation de la page de réinitialisation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
