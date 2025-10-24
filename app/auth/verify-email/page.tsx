"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Link from "next/link"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Veuillez saisir votre adresse email")
      return
    }

    setIsLoading(true)
    try {
      // Essayer de détecter le type d'utilisateur depuis l'URL ou les paramètres
      const urlParams = new URLSearchParams(window.location.search)
      const userType = urlParams.get('user_type') || 'tenant'
      
      await authService.resendVerificationEmail(email, userType)
      setEmailSent(true)
      toast.success("Email de vérification renvoyé !")
    } catch (error: any) {
      console.error("Erreur renvoi email:", error)
      toast.error(error.message || "Erreur lors du renvoi de l'email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vérification de l'email
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Confirmez votre adresse email</CardTitle>
            <CardDescription>
              Nous avons envoyé un lien de vérification à votre adresse email. 
              Vérifiez votre boîte de réception et cliquez sur le lien pour activer votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!emailSent ? (
              <form onSubmit={handleResendEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Envoi en cours...</span>
                    </div>
                  ) : (
                    "Renvoyer l'email de vérification"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    Email envoyé !
                  </h3>
                  <p className="text-gray-600">
                    Un nouvel email de vérification a été envoyé à <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Vérifiez votre boîte de réception et votre dossier spam.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  Envoyer à une autre adresse
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Vous ne recevez pas l'email ?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Vérifiez votre dossier spam</li>
                    <li>L'email peut prendre quelques minutes à arriver</li>
                    <li>Assurez-vous d'avoir saisi la bonne adresse email</li>
                  </ul>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Vous avez déjà vérifié votre email ?{" "}
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
                <p className="text-sm text-gray-600">
                  Besoin d'aide ?{" "}
                  <Link href="/contact" className="text-blue-600 hover:underline font-medium">
                    Nous contacter
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
