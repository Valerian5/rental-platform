"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Home, Building, Shield } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("🔐 Connexion pour:", formData.email)
      const { user } = await authService.login(formData.email, formData.password)

      if (!user) {
        throw new Error("Erreur lors de la connexion")
      }

      toast.success("Connexion réussie !")

      // Redirection simple selon le type
      switch (user.user_type) {
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
    } catch (error: any) {
      console.error("❌ Erreur:", error)
      toast.error(error.message || "Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
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
                  <Building className="h-10 w-10 text-white" />
                </div>
              )}
              <h1 className="text-4xl font-bold text-white mb-4">
                Bienvenue sur Louer Ici
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                La plateforme qui simplifie la location immobilière. 
                Gérez vos biens, trouvez des locataires, et optimisez vos revenus.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 text-white/90">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Home className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Propriétaires</h3>
                  <p className="text-sm text-blue-100">Gérez vos biens et locataires</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-white/90">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Locataires</h3>
                  <p className="text-sm text-blue-100">Trouvez votre logement idéal</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-white/90">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Agences</h3>
                  <p className="text-sm text-blue-100">Développez votre activité</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Formes décoratives */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full"></div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Header mobile */}
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à l'accueil
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
              <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
              <p className="text-gray-600 mt-2">Accédez à votre compte</p>
            </div>

            {/* Header desktop */}
            <div className="hidden lg:block mb-8">
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à l'accueil
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
              <p className="text-gray-600 mt-2">Accédez à votre compte</p>
            </div>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Adresse email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Votre mot de passe"
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
                  </div>

                  <div className="flex items-center justify-between">
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connexion en cours...</span>
                      </div>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Pas encore de compte ?{" "}
                      <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                        Créer un compte
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
