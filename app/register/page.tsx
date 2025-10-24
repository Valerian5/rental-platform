"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Home, Building2, Search, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
  const [userType, setUserType] = useState<string>("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Image et branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
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
                  <Building2 className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
            <h1 className="text-4xl font-bold">Louer Ici</h1>
            <p className="text-xl text-blue-100 max-w-md">
              La plateforme qui simplifie la location immobilière
            </p>
            <div className="space-y-4 text-blue-100">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-300" />
                <span>Recherche simplifiée</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-300" />
                <span>Gestion centralisée</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-300" />
                <span>Sécurité garantie</span>
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
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-2 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
              <CardDescription className="text-gray-600">
                Choisissez votre profil pour commencer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  {userType === "tenant" && (
                    <div className="space-y-4">
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
                      <Button asChild className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium">
                        <Link href="/tenant/register">Créer mon profil locataire</Link>
                      </Button>
                    </div>
                  )}

                  {userType === "owner" && (
                    <div className="space-y-4">
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
                      <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        <Link href="/owner/register">Créer mon profil propriétaire</Link>
                      </Button>
                    </div>
                  )}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
