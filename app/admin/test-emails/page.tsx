"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function TestEmailsPage() {
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'tenant' | 'owner'>('tenant')
  const [emailType, setEmailType] = useState<'welcome' | 'verify' | 'email-change' | 'password-reset'>('welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Array<{type: string, success: boolean, message: string}>>([])

  const handleSendTestEmail = async () => {
    if (!email) {
      toast.error("Veuillez saisir une adresse email")
      return
    }

    setIsLoading(true)
    setResults([])

    try {
      let response
      let result

      switch (emailType) {
        case 'welcome':
          response = await fetch('/api/emails/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: {
                id: 'test-id',
                email: email,
                first_name: 'Test',
                last_name: 'User',
                user_type: userType
              },
              userType
            })
          })
          result = await response.json()
          break

        case 'verify':
          response = await fetch('/api/emails/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              userType,
              token: 'test-token-123'
            })
          })
          result = await response.json()
          break

        case 'email-change':
          response = await fetch('/api/emails/email-change-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: {
                email: email,
                first_name: 'Test'
              },
              oldEmail: 'old@example.com'
            })
          })
          result = await response.json()
          break

        case 'password-reset':
          response = await fetch('/api/emails/password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: {
                email: email,
                first_name: 'Test'
              },
              resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=test-token`
            })
          })
          result = await response.json()
          break
      }

      setResults(prev => [...prev, {
        type: emailType,
        success: response.ok,
        message: result.success ? 'Email envoyé avec succès' : result.error || 'Erreur inconnue'
      }])

      if (response.ok) {
        toast.success(`Email ${emailType} envoyé avec succès`)
      } else {
        toast.error(`Erreur envoi email ${emailType}`)
      }

    } catch (error: any) {
      console.error('Erreur test email:', error)
      setResults(prev => [...prev, {
        type: emailType,
        success: false,
        message: error.message || 'Erreur de connexion'
      }])
      toast.error('Erreur lors du test')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAllEmails = async () => {
    if (!email) {
      toast.error("Veuillez saisir une adresse email")
      return
    }

    setIsLoading(true)
    setResults([])

    const emailTypes = ['welcome', 'verify', 'email-change', 'password-reset'] as const

    for (const type of emailTypes) {
      try {
        setEmailType(type)
        await handleSendTestEmail()
        // Attendre un peu entre chaque envoi
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Erreur envoi ${type}:`, error)
      }
    }

    setIsLoading(false)
    toast.success("Test de tous les emails terminé")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Test des emails personnalisés
          </h1>
          <p className="text-gray-600">
            Testez l'envoi des différents types d'emails personnalisés
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Configuration du test</span>
            </CardTitle>
            <CardDescription>
              Configurez les paramètres pour tester l'envoi d'emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email de test</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userType">Type d'utilisateur</Label>
                <Select value={userType} onValueChange={(value: 'tenant' | 'owner') => setUserType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Locataire</SelectItem>
                    <SelectItem value="owner">Propriétaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailType">Type d'email à tester</Label>
              <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Email de bienvenue</SelectItem>
                  <SelectItem value="verify">Email de vérification</SelectItem>
                  <SelectItem value="email-change">Changement d'email</SelectItem>
                  <SelectItem value="password-reset">Réinitialisation mot de passe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={handleSendTestEmail}
                disabled={isLoading || !email}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Envoyer l'email de test</span>
              </Button>

              <Button 
                variant="outline"
                onClick={handleSendAllEmails}
                disabled={isLoading || !email}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                <span>Tester tous les emails</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Résultats des tests</CardTitle>
              <CardDescription>
                Historique des envois d'emails de test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        {result.type === 'welcome' && 'Email de bienvenue'}
                        {result.type === 'verify' && 'Email de vérification'}
                        {result.type === 'email-change' && 'Changement d\'email'}
                        {result.type === 'password-reset' && 'Réinitialisation mot de passe'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.message}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'Succès' : 'Échec'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Configuration Supabase</h4>
              <p className="text-sm text-gray-600">
                Assurez-vous que les politiques d'email sont configurées dans Supabase
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Variables d'environnement</h4>
              <p className="text-sm text-gray-600">
                Vérifiez que NEXT_PUBLIC_SITE_URL est configuré avec votre domaine de production
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Service d'email</h4>
              <p className="text-sm text-gray-600">
                Assurez-vous que le service d'email (Resend, etc.) est configuré
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
