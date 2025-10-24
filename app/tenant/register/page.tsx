"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, User, Search, Mail, Lock, Phone } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Image from "next/image"

export default function TenantRegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  })

  // Charger le logo depuis les paramètres admin
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/public/logo')
        if (response.ok) {
          const data = await response.json()
          setLogoUrl(data.logo_url)
        }
      } catch (error) {
        console.log("Logo non configuré, utilisation du logo par défaut")
      }
    }
    loadLogo()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validation basique
      if (formData.password.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères")
        return
      }

      // Créer le compte avec Supabase
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        userType: "tenant",
      })

      toast.success("Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.")

      // Rediriger vers la page de connexion
      router.push("/login")
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error)
      toast.error(error.message || "Erreur lors de la création du compte")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Image et branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center space-y-6">
            {logoUrl ? (
              <div className="mb-8">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={120}
                  height={120}
                  className="mx-auto rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="mb-8">
                <div className="w-24 h-24 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
            <h1 className="text-4xl font-bold">Espace Locataire</h1>
            <p className="text-xl text-green-100 max-w-md">
              Trouvez votre logement idéal avec simplicité et sécurité
            </p>
            <div className="space-y-4 text-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>Recherche simplifiée</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>Postulation en un clic</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>Suivi en temps réel</span>
              </div>
            </div>
          </div>
        </div>
        {/* Décoration de fond */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Section droite - Formulaire d'inscription */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="text-green-600 hover:underline flex items-center justify-center mb-6 text-sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à l'accueil
            </Link>
            
            {/* Logo mobile */}
            <div className="lg:hidden mb-6">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="mx-auto rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-2 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Créer un compte locataire</CardTitle>
              <CardDescription className="text-gray-600">
                Rejoignez Louer Ici pour trouver votre logement idéal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">Prénom *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      placeholder="Votre prénom"
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Nom *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Votre nom"
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="votre.email@exemple.com"
                      className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Au moins 6 caractères"
                      minLength={6}
                      className="pl-10 pr-12 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
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

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Création en cours...</span>
                    </div>
                  ) : (
                    "Créer mon compte"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Déjà inscrit ?{" "}
                    <Link href="/login" className="text-green-600 hover:underline font-medium">
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
  )
}
