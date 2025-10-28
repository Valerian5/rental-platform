"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Home, Building, Users, TrendingUp, Search, CheckCircle, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<string>("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    password: "",
    phone: "",
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

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

  // Validation du mot de passe
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
    if (!userType) {
      toast.error("Veuillez sélectionner votre profil")
      return
    }

    if (formData.email !== formData.confirmEmail) {
      toast.error("Les adresses email ne correspondent pas")
      return
    }

    if (passwordErrors.length > 0) {
      toast.error("Le mot de passe ne respecte pas les critères requis")
      return
    }

    setIsLoading(true)

    try {

      // Créer le compte avec Supabase
      const result = await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        userType: userType as "tenant" | "owner",
      })

      if (result.needsVerification) {
        toast.success("Compte créé ! Vérifiez votre email pour activer votre compte.")
        router.push("/auth/verify-email")
      } else {
        toast.success("Compte créé avec succès ! Vous êtes maintenant connecté.")
        // Rediriger vers le tableau de bord approprié
        if (userType === "owner") {
          router.push("/owner/dashboard")
        } else {
          router.push("/tenant/dashboard")
        }
      }
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
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
                <h3 className="font-semibold text-white">Gestion simplifiée</h3>
                <p className="text-sm text-blue-100">Publiez vos annonces en quelques clics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-white/90">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Locataires qualifiés</h3>
                <p className="text-sm text-blue-100">Trouvez des candidats sérieux</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-white/90">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Revenus optimisés</h3>
                <p className="text-sm text-blue-100">Maximisez vos profits locatifs</p>
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
            <Link href="/" className="text-blue-600 hover:underline flex items-center justify-center mb-6 text-sm">
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
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <Building className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-2 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
              <CardDescription className="text-gray-600">
                Choisissez votre profil pour commencer
              </CardDescription>
        </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Je suis :</Label>
            <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Sélectionnez votre profil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Locataire</div>
                            <div className="text-sm text-gray-500">Je cherche un logement</div>
                          </div>
                  </div>
                </SelectItem>
                <SelectItem value="owner">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Home className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Propriétaire</div>
                            <div className="text-sm text-gray-500">Je loue mon bien</div>
                          </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userType && (
                  <div className="space-y-6">
                    {/* Informations personnelles */}
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
                          className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                          className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmEmail" className="text-sm font-medium text-gray-700">Confirmer l'email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmEmail"
                          name="confirmEmail"
                          type="email"
                          value={formData.confirmEmail || ""}
                          onChange={handleChange}
                          required
                          placeholder="Confirmez votre email"
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      {formData.confirmEmail && formData.email !== formData.confirmEmail && (
                        <p className="text-sm text-red-600">Les adresses email ne correspondent pas</p>
                      )}
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
                          placeholder="Au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial"
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
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Description du profil sélectionné */}
              {userType === "tenant" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Search className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-green-800">Profil Locataire</h3>
                            <p className="text-sm text-green-700 mt-1">
                              Recherchez des logements, postulez aux annonces et gérez vos candidatures.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {userType === "owner" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Home className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-blue-800">Profil Propriétaire</h3>
                            <p className="text-sm text-blue-700 mt-1">
                              Publiez vos annonces, gérez les candidatures et suivez vos locations.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className={`w-full h-12 text-white font-medium ${
                        userType === "owner" 
                          ? "bg-blue-600 hover:bg-blue-700" 
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Création en cours...</span>
                        </div>
                      ) : (
                        `Créer mon compte ${userType === "owner" ? "propriétaire" : "locataire"}`
                      )}
                  </Button>
                </div>
              )}

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Déjà inscrit ?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
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
