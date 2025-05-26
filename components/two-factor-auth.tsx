"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { QrCode, Shield, Smartphone, Key, CheckCircle, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TwoFactorAuthProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

export function TwoFactorAuth({ isEnabled, onToggle }: TwoFactorAuthProps) {
  const [showSetup, setShowSetup] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const generateSetup = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setQrCodeUrl(data.qrCodeUrl)
        setSecretKey(data.secret)
        setBackupCodes(data.backupCodes)
        setStep(2)
      } else {
        setError(data.error || "Erreur lors de la génération")
      }
    } catch (error) {
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError("Le code doit contenir 6 chiffres")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep(3)
        onToggle(true)
      } else {
        setError(data.error || "Code incorrect")
      }
    } catch (error) {
      setError("Erreur de vérification")
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        onToggle(false)
        setShowSetup(false)
        setStep(1)
        setVerificationCode("")
      } else {
        const data = await response.json()
        setError(data.error || "Erreur lors de la désactivation")
      }
    } catch (error) {
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentification à deux facteurs
        </CardTitle>
        <CardDescription>Ajoutez une couche de sécurité supplémentaire à votre compte</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Statut :</span>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activé
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Désactivé
                </>
              )}
            </Badge>
          </div>

          {isEnabled ? (
            <Button variant="destructive" onClick={disable2FA} disabled={loading}>
              Désactiver
            </Button>
          ) : (
            <Dialog open={showSetup} onOpenChange={setShowSetup}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setShowSetup(true)
                    generateSetup()
                  }}
                >
                  Activer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configuration 2FA</DialogTitle>
                  <DialogDescription>Suivez les étapes pour sécuriser votre compte</DialogDescription>
                </DialogHeader>

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Smartphone className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">Étape 1 : Application d'authentification</h3>
                      <p className="text-sm text-muted-foreground">
                        Installez une application comme Google Authenticator ou Authy sur votre téléphone
                      </p>
                    </div>
                    <Button onClick={generateSetup} disabled={loading} className="w-full">
                      {loading ? "Génération..." : "Continuer"}
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">Étape 2 : Scanner le QR Code</h3>
                    </div>

                    {qrCodeUrl && (
                      <div className="text-center">
                        <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code 2FA" className="mx-auto mb-4" />
                        <p className="text-xs text-muted-foreground mb-2">Ou entrez manuellement cette clé :</p>
                        <code className="text-xs bg-gray-100 p-2 rounded block break-all">{secretKey}</code>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Code de vérification</Label>
                      <Input
                        id="verification-code"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Entrez le code à 6 chiffres généré par votre application
                      </p>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={verifyAndEnable}
                      disabled={loading || verificationCode.length !== 6}
                      className="w-full"
                    >
                      {loading ? "Vérification..." : "Vérifier et activer"}
                    </Button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">2FA activé avec succès !</h3>
                    </div>

                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important :</strong> Sauvegardez ces codes de récupération dans un endroit sûr. Ils vous
                        permettront d'accéder à votre compte si vous perdez votre téléphone.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Codes de récupération :</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="bg-white p-2 rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                        Télécharger
                      </Button>
                      <Button onClick={() => setShowSetup(false)} className="flex-1">
                        Terminer
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        {error && !showSetup && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
