"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [siteTitle, setSiteTitle] = useState("Louer Ici")

  // Fetch logo and site settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [logoResponse, siteInfoResponse] = await Promise.all([
          fetch("/api/admin/settings?key=logos"),
          fetch("/api/admin/settings?key=site_info"),
        ])

        const logoResult = await logoResponse.json()
        const siteInfoResult = await siteInfoResponse.json()

        if (logoResult.success && logoResult.data?.main) {
          setLogoUrl(logoResult.data.main)
        }

        if (siteInfoResult.success && siteInfoResult.data?.title) {
          setSiteTitle(siteInfoResult.data.title)
        }
      } catch (error) {
        console.error("Erreur récupération paramètres:", error)
      }
    }

    fetchSettings()
  }, [])

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          switch (currentUser.user_type) {
            case "owner":
              router.push("/owner/dashboard")
              break
            case "tenant":
              router.push("/tenant/dashboard")
              break
            case "admin":
              router.push("/admin")
              break
            default:
              router.push("/")
          }
        }
      } catch (error) {
        // Not connected, continue to login
      }
    }
    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide"
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log("🔐 Tentative de connexion pour:", formData.email)

      const result = await authService.login(formData.email, formData.password)

      if (!result.user || !result.session) {
        throw new Error("Erreur lors de la connexion")
      }

      console.log("✅ Connexion réussie:", result.user)

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${result.user.first_name} !`,
      })

      // Attendre un peu pour que le toast s'affiche
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirection basée sur le type d'utilisateur
      const userType = result.user.user_type
      console.log("🔄 Redirection pour type:", userType)

      switch (userType) {
        case "admin":
          window.location.href = "/admin"
          break
        case "owner":
          window.location.href = "/owner/dashboard"
          break
        case "tenant":
          window.location.href = "/tenant/dashboard"
          break
        default:
          window.location.href = "/"
      }
    } catch (error) {
      console.error("❌ Erreur connexion:", error)

      let errorMessage = "Erreur de connexion"

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect"
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email avant de vous connecter"
      } else if (error.message?.includes("Too many requests")) {
        errorMessage = "Trop de tentatives. Veuillez réessayer plus tard"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      })

      setErrors({
        general: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {logoUrl ? (
              <img src={logoUrl || "/placeholder.svg"} alt={siteTitle} className="h-16 object-contain" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-600 mt-2">Accédez à votre espace personnel</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Se connecter</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="text-sm">
                  <Link href="/debug" className="text-gray-500 hover:text-gray-700">
                    Debug
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Se connecter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                  S'inscrire
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← Retour à l'accueil
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Test accounts info */}
        <div className="mt-6 p-4 bg-white/50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Comptes de test :</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Propriétaire :</strong> owner@test.com / password123
            </p>
            <p>
              <strong>Locataire :</strong> tenant@test.com / password123
            </p>
            <p>
              <strong>Admin :</strong> admin@test.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
