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

      // Attendre un peu pour que les cookies se mettent en place
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Récupérer les informations de l'utilisateur pour rediriger selon son type
      const currentUser = await authService.getCurrentUser()
      console.log("👤 Utilisateur actuel:", currentUser)

      if (currentUser) {
        console.log("🎯 Redirection vers:", currentUser.user_type)
        // Redirection selon le type d'utilisateur
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
      } else {
        router.push("/")
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
    <div className="container mx-auto py-8 max-w-md">
      <Link href="/" className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour à l'accueil
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Se connecter</CardTitle>
          <CardDescription>Accédez à votre compte Louer Ici</CardDescription>
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

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
              <Link href="/debug" className="text-sm text-gray-500 hover:underline">
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
  )
}
