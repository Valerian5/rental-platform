"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Database, Home } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"

export default function MigratePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<{
    etat_des_lieux_documents: boolean
    etat_des_lieux_templates: boolean
  }>({
    etat_des_lieux_documents: false,
    etat_des_lieux_templates: false
  })

  const runMigration = async () => {
    try {
      setIsMigrating(true)
      
      const response = await fetch("/api/migrate/etat-des-lieux", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        const result = await response.json()
        setMigrationStatus({
          etat_des_lieux_documents: true,
          etat_des_lieux_templates: true
        })
        
        toast({
          title: "Succès",
          description: "Migration terminée avec succès",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la migration")
      }
    } catch (error) {
      console.error("Erreur migration:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la migration",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Migration de la Base de Données</h1>
          <p className="text-gray-600">Exécuter les migrations pour l'état des lieux</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tables à Créer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>etat_des_lieux_documents</span>
              {migrationStatus.etat_des_lieux_documents ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Créée
                </Badge>
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>etat_des_lieux_templates</span>
              {migrationStatus.etat_des_lieux_templates ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Créée
                </Badge>
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Fonctionnalités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">✅ État des lieux numérique</p>
            <p className="text-sm">✅ Gestion des modèles PDF</p>
            <p className="text-sm">✅ Upload de documents</p>
            <p className="text-sm">✅ Interface admin complète</p>
            <p className="text-sm">✅ Sécurité RLS activée</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exécuter la Migration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Cette migration va créer les tables nécessaires pour la fonctionnalité d'état des lieux.
            Assurez-vous d'être connecté en tant qu'administrateur.
          </p>
          
          <div className="flex gap-4">
            <Button 
              onClick={runMigration} 
              disabled={isMigrating}
              className="flex-1"
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Migration en cours...
                </>
              ) : (
                "Exécuter la Migration"
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin")}
            >
              Retour à l'Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
