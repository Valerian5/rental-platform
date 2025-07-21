"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        console.log("🔍 Login page - Vérification auth:", currentUser)

        if (currentUser) {
          console.log("✅ Login page - Utilisateur déjà connecté, redirection...")
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
        console.log("❌ Login page - Pas d'utilisateur connecté")
      }
    }

    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Améliorer la gestion de la connexion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("🔐 Tentative de connexion avec:", formData.email)

      // Connexion avec Supabase
      const { user, session } = await authService.login(formData.email, formData.password)

      console.log("✅ Résultat connexion:", { user: !!user, session: !!session })

      if (!user || !session) {
        throw new Error("Erreur lors de la connexion")
      }

      toast.success("Connexion réussie !")

      // Attendre que la session soit bien établie
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("🎯 Redirection vers:", user.user_type)

      // Redirection selon le type d'utilisateur
      switch (user.user_type) {
        case "owner":
          window.location.href = "/owner/dashboard"
          break
        case "tenant":
          window.location.href = "/tenant/dashboard"
          break
        case "admin":
          window.location.href = "/admin"
          break
        default:
          window.location.href = "/"
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la connexion:", error)

      // Messages d'erreur plus spécifiques
      let errorMessage = "Erreur de connexion"
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect"
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email avant de vous connecter"
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Trop de tentatives. Veuillez réessayer plus tard"
      } else {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Home className="h-6 w-6 text-white" />
            </div>
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