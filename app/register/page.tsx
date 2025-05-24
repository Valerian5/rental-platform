"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Home } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [userType, setUserType] = useState<string>("")

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Link href="/" className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour à l'accueil
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Rejoignez Louer Ici pour commencer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Je suis :</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre profil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Locataire - Je cherche un logement
                  </div>
                </SelectItem>
                <SelectItem value="owner">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Propriétaire - Je loue mon bien
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userType && (
            <div className="space-y-4">
              {userType === "tenant" && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    En tant que locataire, vous pourrez rechercher des logements, postuler aux annonces et gérer vos
                    candidatures.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/tenant/register">Créer mon profil locataire</Link>
                  </Button>
                </div>
              )}

              {userType === "owner" && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    En tant que propriétaire, vous pourrez publier vos annonces, gérer les candidatures et suivre vos
                    locations.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/owner/register">Créer mon profil propriétaire</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
