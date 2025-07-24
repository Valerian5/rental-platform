"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Fetch logo depuis Supabase Settings
  useEffect(() => {
    console.log("🔍 Login - Récupération logo...")
    fetch("/api/admin/settings?key=logos")
      .then((res) => res.json())
      .then((data) => {
        console.log("📋 Login - Résultat logos:", data)
        if (data.success && data.data) {
          let logoUrl = null
          if (typeof data.data === "object" && data.data.main) {
            logoUrl = data.data.main
          } else if (typeof data.data === "string") {
            logoUrl = data.data
          }
          console.log("✅ Login - Logo défini:", logoUrl)
          setLogoUrl(logoUrl)
        }
      })
      .catch((error) => {
        console.error("❌ Login - Erreur récupération logo:", error)
        setLogoUrl(null)
      })
  }, [])

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Vérification authentification existante...")
        const currentUser = await authService.getCurrentUser()

        if (currentUser) {
          console.log("✅ Utilisateur déjà connecté:", currentUser.user_type)

          // Récupérer l'URL de redirection
          const redirectUrl = searchParams.get("redirect")

          if (redirectUrl) {
            console.log("🔄 Redirection vers:", redirectUrl)
            router.push(redirectUrl)
          } else {
            // Redirection par défaut selon le type d'utilisateur
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
              case "agency":
                router.push("/agency/dashboard")
                break
              default:
                router.push("/")
            }
          }
        } else {
          console.log("❌ Pas d'utilisateur connecté")
        }
      } catch (error) {
        console.log("❌ Erreur vérification auth:", error)
        // Pas connecté, on reste sur la page login
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("🔐 Tentative de connexion pour:", formData.email)
      const { user, session } = await authService.login(formData.email, formData.password)

      if (!user || !session) {
        throw new Error("Erreur lors de la connexion")
      }

      console.log("✅ Connexion réussie:", user)
      toast.success("Connexion réussie !")

      // Attendre un peu pour que le toast s'affiche
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Récupérer l'URL de redirection
      const redirectUrl = searchParams.get("redirect")

      if (redirectUrl) {
        console.log("🔄 Redirection vers:", redirectUrl)
        window.location.href = redirectUrl
      } else {
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
          case "agency":
            window.location.href = "/agency/dashboard"
            break
          default:
            window.location.href = "/"
        }
      }
    } catch (error: any) {
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

      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher un loader pendant la vérification d'auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Vérification...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Link href="/" className="text-blue-600 hover:underline flex items-center mb-4 text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à l'accueil
        </Link>

        {/* Affichage du logo */}
        {logoUrl && (
          <div className="flex justify-center">
            <img
              src={logoUrl || "/placeholder.svg"}
              alt="Logo"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                console.error("❌ Erreur chargement logo login:", logoUrl)
                setLogoUrl(null)
              }}
            />
          </div>
        )}

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Se connecter</CardTitle>
            <CardDescription className="text-center">Accédez à votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-blue-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
                <Link href="/debug" className="text-gray-500 hover:underline">
                  Debug
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Pas encore inscrit ?{" "}
                <Link href="/register" className="text-blue-600 hover:underline">
                  Créer un compte
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
