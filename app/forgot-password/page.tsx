"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulation d'envoi d'email - à remplacer par votre service Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Ici vous ajouterez votre logique de réinitialisation avec Supabase
      // await authService.resetPassword(email)

      setEmailSent(true)
      toast({ title: "Succès", description: "Email de réinitialisation envoyé !" })
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error)
      toast({ title: "Erreur", description: "Erreur lors de l'envoi de l'email", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Link href="/login" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la connexion
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-green-600" />
              Email envoyé !
            </CardTitle>
            <CardDescription>Vérifiez votre boîte de réception</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>. Cliquez sur le lien dans l'email
              pour créer un nouveau mot de passe.
            </p>

            <div className="text-center">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Retour à la connexion</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Link href="/login" className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour à la connexion
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe oublié</CardTitle>
          <CardDescription>Entrez votre email pour recevoir un lien de réinitialisation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{" "}
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
