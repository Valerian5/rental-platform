"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function TenantRegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  })

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

      // Rediriger vers le tableau de bord locataire
      router.push("/tenant/dashboard")
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error)
      toast.error(error.message || "Erreur lors de la création du compte")
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
          <CardTitle>Créer un compte locataire</CardTitle>
          <CardDescription>Rejoignez Louer Ici pour trouver votre logement idéal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Votre prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre.email@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Au moins 6 caractères"
                  minLength={6}
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

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="06 12 34 56 78"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Création en cours..." : "Créer mon compte"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Se connecter
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
