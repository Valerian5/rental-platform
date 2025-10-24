"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Veuillez saisir votre adresse email")
      return
    }

    setIsLoading(true)
    try {
      // Utiliser la fonction Supabase pour déclencher l'email de réinitialisation
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.rpc('trigger_password_reset', {
        user_email: email,
        user_id: null, // Sera récupéré automatiquement
        first_name: null
      })

      if (error) {
        throw new Error(error.message)
      }

      setEmailSent(true)
      toast.success("Email de réinitialisation envoyé !")
    } catch (error: any) {
      console.error("Erreur envoi email de réinitialisation:", error)
      toast.error(error.message || "Erreur lors de l'envoi de l'email")
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
                  <Mail className="h-10 w-10 text-white" />
                </div>
              )}
              <h1 className="text-4xl font-bold text-white mb-4">
                Mot de passe oublié ?
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Pas de panique ! Nous allons vous envoyer un lien pour réinitialiser votre mot de passe.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <span>Saisissez votre adresse email</span>
              </div>
              
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <span>Vérifiez votre boîte de réception</span>
              </div>
              
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <span>Cliquez sur le lien reçu</span>
              </div>
            </div>
          </div>
          
          {/* Formes décoratives */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Header mobile */}
            <div className="lg:hidden mb-8 text-center">
              <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à la connexion
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
              <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
              <p className="text-gray-600 mt-2">Nous allons vous aider à le récupérer</p>
            </div>

            {/* Header desktop */}
            <div className="hidden lg:block mb-8">
              <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à la connexion
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Mot de passe oublié</h1>
              <p className="text-gray-600 mt-2">Nous allons vous aider à le récupérer</p>
            </div>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                {!emailSent ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Adresse email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre.email@exemple.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Saisissez l'adresse email associée à votre compte
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Envoi en cours...</span>
                        </div>
                      ) : (
                        "Envoyer le lien de réinitialisation"
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Vous vous souvenez de votre mot de passe ?{" "}
                        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                          Se connecter
                        </Link>
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Email envoyé !
                      </h3>
                      <p className="text-gray-600">
                        Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Vérifiez votre boîte de réception</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>L'email peut prendre quelques minutes à arriver</li>
                            <li>Vérifiez votre dossier spam</li>
                            <li>Le lien est valide pendant 24 heures</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        onClick={() => setEmailSent(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Envoyer à une autre adresse
                      </Button>
                      
                      <Link href="/login">
                        <Button variant="ghost" className="w-full">
                          Retour à la connexion
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}