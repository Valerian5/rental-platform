"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Settings } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface ChargeSettingsManagerProps {
  leaseId: string
  onSettingsChange?: (settings: any[]) => void
  calculationNotes?: string
  onCalculationNotesChange?: (notes: string) => void
}

// Charges récupérables selon Service-Public.fr
const RECOVERABLE_CHARGES = [
  { id: 'water', name: 'Eau froide', description: 'Eau froide et chaude de l\'ensemble des occupants' },
  { id: 'heating', name: 'Chauffage collectif', description: 'Fourniture d\'énergie et exploitation des compteurs' },
  { id: 'elevator', name: 'Ascenseur', description: 'Électricité, exploitation et menues réparations' },
  { id: 'common_electricity', name: 'Électricité parties communes', description: 'Éclairage et équipements des parties communes' },
  { id: 'garbage_tax', name: 'Taxe ordures ménagères (TEOM)', description: 'Taxe ou redevance d\'enlèvement des ordures ménagères' },
  { id: 'cleaning', name: 'Nettoyage parties communes', description: 'Produits d\'entretien et personnel d\'entretien' },
  { id: 'gardener', name: 'Entretien espaces verts', description: 'Voies de circulation, aires de stationnement, espaces verts' },
  { id: 'insurance', name: 'Assurance propriétaire', description: 'Assurance du bien (non récupérable)' }
]

export function ChargeSettingsManagerNew({
  leaseId,
  onSettingsChange,
  calculationNotes = '',
  onCalculationNotesChange
}: ChargeSettingsManagerProps) {
  const [selectedCharges, setSelectedCharges] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState(calculationNotes)
  const [isLoading, setIsLoading] = useState(false)

  // Fonction stable pour notifier les changements
  const notifySettingsChange = useCallback((charges: Record<string, boolean>) => {
    if (onSettingsChange && charges) {
      try {
        const categories = RECOVERABLE_CHARGES
          .filter(charge => charge && charge.id && charges[charge.id])
          .map(charge => ({
            id: charge.id,
            name: charge.name,
            isRecoverable: charge.id !== 'insurance'
          }))
        onSettingsChange(categories)
      } catch (error) {
        console.error('Erreur lors de la notification des changements:', error)
      }
    }
  }, [onSettingsChange])

  // Charger les paramètres existants
  useEffect(() => {
    const loadSettings = async () => {
      if (!leaseId) return

      try {
        const { data: settings, error } = await supabase
          .from('lease_charge_settings')
          .select('*')
          .eq('lease_id', leaseId)
          .single()

        if (settings && !error) {
          console.log('⚙️ Paramètres de charges chargés:', settings)
          
          // Reconstituer les charges sélectionnées
          const charges = {
            water: settings.water_charges || false,
            heating: settings.heating_charges || false,
            elevator: settings.elevator_charges || false,
            common_electricity: settings.common_electricity || false,
            garbage_tax: settings.garbage_tax || false,
            cleaning: settings.cleaning_charges || false,
            gardener: settings.gardener_charges || false,
            insurance: settings.insurance_charges || false
          }
          
          setSelectedCharges(charges)
          setNotes(settings.calculation_method || '')
          
          // Notifier le parent des catégories sélectionnées
          notifySettingsChange(charges)
        } else {
          console.log('ℹ️ Aucun paramètre de charges trouvé')
        }
      } catch (error) {
        console.error('Erreur chargement paramètres:', error)
      }
    }

    loadSettings()
  }, [leaseId, notifySettingsChange])

  const handleChargeToggle = (chargeId: string) => {
    if (!chargeId) return
    
    const updated = { ...selectedCharges, [chargeId]: !selectedCharges[chargeId] }
    setSelectedCharges(updated)
    
    // Notifier le parent des catégories sélectionnées avec un délai pour éviter les appels multiples
    setTimeout(() => {
      notifySettingsChange(updated)
    }, 0)
  }

  const handleSave = async () => {
    if (!leaseId) return

    setIsLoading(true)
    try {
      // Vérifier si des paramètres existent déjà
      const { data: existingSettings } = await supabase
        .from('lease_charge_settings')
        .select('id')
        .eq('lease_id', leaseId)
        .single()

      const settingsData = {
        lease_id: leaseId,
        water_charges: selectedCharges.water || false,
        heating_charges: selectedCharges.heating || false,
        elevator_charges: selectedCharges.elevator || false,
        common_electricity: selectedCharges.common_electricity || false,
        garbage_tax: selectedCharges.garbage_tax || false,
        cleaning_charges: selectedCharges.cleaning || false,
        gardener_charges: selectedCharges.gardener || false,
        insurance_charges: selectedCharges.insurance || false,
        calculation_method: notes
      }

      if (existingSettings) {
        // Mettre à jour les paramètres existants
        const { error } = await supabase
          .from('lease_charge_settings')
          .update(settingsData)
          .eq('id', existingSettings.id)

        if (error) throw error
      } else {
        // Créer de nouveaux paramètres
        const { error } = await supabase
          .from('lease_charge_settings')
          .insert(settingsData)

        if (error) throw error
      }

      if (onCalculationNotesChange) {
        onCalculationNotesChange(notes)
      }

      // Notifier les changements de catégories après sauvegarde
      notifySettingsChange(selectedCharges)

      toast.success("Paramètres sauvegardés")
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center text-blue-800">
          <Settings className="h-5 w-5 mr-2" />
          Paramétrage des charges du bail
        </CardTitle>
        <CardDescription className="text-blue-700">
          Sélectionnez les charges récupérables selon la réglementation Service-Public.fr
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Liste des charges récupérables */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Charges récupérables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RECOVERABLE_CHARGES.map((charge) => (
              <div key={charge.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                <Checkbox
                  id={charge.id}
                  checked={selectedCharges[charge.id] || false}
                  onCheckedChange={() => handleChargeToggle(charge.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={charge.id} className="font-medium text-gray-900 cursor-pointer">
                    {charge.name}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {charge.description}
                  </p>
                  {charge.id === 'insurance' && (
                    <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Non récupérable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Méthode de calcul */}
        <div className="space-y-2">
          <Label htmlFor="calculation-method" className="font-medium text-gray-900">
            Méthode de calcul des charges
          </Label>
          <Textarea
            id="calculation-method"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Décrivez votre méthode de calcul des charges (ex: Répartition au prorata de la surface + relevés fournisseurs)"
            className="min-h-[80px]"
          />
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
