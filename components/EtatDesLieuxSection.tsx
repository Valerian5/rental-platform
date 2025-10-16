"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Home, Plus } from "lucide-react"
import { EtatDesLieuxDownloadSection } from "./EtatDesLieuxDownloadSection"
import { EtatDesLieuxDigitalSection } from "./EtatDesLieuxDigitalSection"

interface PropertyData {
  id: string
  rooms: number
  bedrooms: number
  surface: number
  address: string
  city: string
  postal_code: string
}

interface LeaseData {
  locataire_nom_prenom: string
  bailleur_nom_prenom: string
  adresse_logement: string
  date_prise_effet: string
}

interface EtatDesLieuxSectionProps {
  leaseId: string
  propertyId: string
  propertyData?: PropertyData
  leaseData: LeaseData
}

export function EtatDesLieuxSection({ leaseId, propertyId, propertyData, leaseData }: EtatDesLieuxSectionProps) {
  const [digitalMode, setDigitalMode] = useState(false)
  const [hasExistingDigitalData, setHasExistingDigitalData] = useState(false)
  const roomCount = propertyData?.rooms || 1

  // Vérifier s'il y a des données existantes au chargement
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/digital?type=sortie`)
        if (response.ok) {
          const payload = await response.json()
          const data = payload.data || payload
          if (data.general_info || (data.rooms && data.rooms.length > 0)) {
            setHasExistingDigitalData(true)
            setDigitalMode(true)
            return
          }
        }
        // Fallback: vérifier l'entrée
        const responseEntry = await fetch(`/api/leases/${leaseId}/etat-des-lieux/digital?type=entree`)
        if (responseEntry.ok) {
          const payload = await responseEntry.json()
          const data = payload.data || payload
          if (data.general_info || (data.rooms && data.rooms.length > 0)) {
            setHasExistingDigitalData(true)
            setDigitalMode(true)
          }
        }
      } catch (error) {
        console.error("Erreur vérification données existantes:", error)
      }
    }
    checkExistingData()
  }, [leaseId])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            État des lieux - {propertyData?.address || "Propriété"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="font-medium">Propriétaire</Label>
              <p className="text-gray-600">{leaseData.bailleur_nom_prenom}</p>
            </div>
            <div>
              <Label className="font-medium">Locataire</Label>
              <p className="text-gray-600">{leaseData.locataire_nom_prenom}</p>
            </div>
            <div>
              <Label className="font-medium">Nombre de pièces</Label>
              <p className="text-gray-600">{roomCount} pièce{roomCount > 1 ? "s" : ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="bg-white">
          <TabsTrigger value="manual">État des lieux manuel</TabsTrigger>
          <TabsTrigger value="digital">État des lieux digital</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <EtatDesLieuxDownloadSection
            leaseId={leaseId}
            propertyId={propertyId}
            propertyData={propertyData}
            leaseData={leaseData}
            mode="manual"
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <EtatDesLieuxDownloadSection
            leaseId={leaseId}
            propertyId={propertyId}
            propertyData={propertyData}
            leaseData={leaseData}
            mode="documents"
          />
        </TabsContent>

        <TabsContent value="digital" className="space-y-6">
          {!digitalMode ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">État des lieux numérique</h3>
              <p className="text-gray-600 mb-4">
                Interface complète pour créer des états des lieux détaillés
              </p>
              <button
                onClick={() => {
                  setDigitalMode(true)
                  setHasExistingDigitalData(true)
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Commencer l'état des lieux numérique
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">État des lieux numérique</h3>
                <button
                  onClick={() => setDigitalMode(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Retour
                </button>
              </div>
              <EtatDesLieuxDigitalSection
                leaseId={leaseId}
                propertyId={propertyId}
                propertyData={propertyData}
                leaseData={leaseData}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
