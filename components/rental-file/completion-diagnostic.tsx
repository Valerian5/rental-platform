"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Info } from "lucide-react"
import { rentalFileService } from "@/lib/rental-file-service"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CompletionDiagnosticProps {
  rentalFile: any
}

// Ajouter un état dans le composant
export function CompletionDiagnostic({ rentalFile }: CompletionDiagnosticProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const diagnostic = rentalFileService.getDiagnostic(rentalFile)
  const completionPercentage = rentalFile?.completion_percentage || 0

  const requiredCompleted = diagnostic.required.filter((item) => item.completed).length
  const requiredTotal = diagnostic.required.length
  const optionalCompleted = diagnostic.optional.filter((item) => item.completed).length
  const optionalTotal = diagnostic.optional.length

  // Filtrer les éléments manquants
  const missingRequired = diagnostic.required.filter((item) => !item.completed)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-blue-600" />
          <span>Diagnostic de complétude</span>
          <Badge variant={completionPercentage >= 100 ? "default" : "secondary"}>{completionPercentage}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progression globale avec icônes */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Progression globale
            </span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span className={completionPercentage >= 20 ? "text-blue-600 font-medium" : ""}>20%</span>
            <span className={completionPercentage >= 40 ? "text-blue-600 font-medium" : ""}>40%</span>
            <span className={completionPercentage >= 60 ? "text-blue-600 font-medium" : ""}>60%</span>
            <span className={completionPercentage >= 80 ? "text-blue-600 font-medium" : ""}>80%</span>
            <span className={completionPercentage >= 100 ? "text-blue-600 font-medium" : ""}>100%</span>
          </div>
        </div>

        {/* Éléments obligatoires manquants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Éléments manquants
            </h4>
            <Badge variant="destructive">
              {requiredTotal - requiredCompleted}/{requiredTotal}
            </Badge>
          </div>

          {missingRequired.length > 0 ? (
            <div className="space-y-2">
              {missingRequired.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">{item.item}</p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Tous les éléments obligatoires sont complétés !</p>
            </div>
          )}
        </div>

        {/* Bouton pour afficher/masquer les éléments complétés */}
        <Button variant="outline" onClick={() => setShowCompleted(!showCompleted)} className="w-full">
          {showCompleted ? "Masquer les éléments complétés" : "Afficher les éléments complétés"}
          {showCompleted ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>

        {/* Éléments complétés (conditionnellement affichés) */}
        {showCompleted && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Éléments complétés
              </h4>
              <Badge variant="default">
                {requiredCompleted}/{requiredTotal}
              </Badge>
            </div>

            <div className="space-y-2">
              {diagnostic.required
                .filter((item) => item.completed)
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-green-100 bg-green-50"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{item.item}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Éléments optionnels (conditionnellement affichés) */}
        {showCompleted && diagnostic.optional.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-600" />
                Éléments optionnels (recommandés)
              </h4>
              <Badge variant="outline">
                {optionalCompleted}/{optionalTotal}
              </Badge>
            </div>

            <div className="space-y-2">
              {diagnostic.optional.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                  <div className="flex items-center space-x-3">
                    {item.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Info className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{item.item}</p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <Badge variant={item.completed ? "default" : "outline"} className="text-xs">
                    {item.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résumé */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">Résumé</p>
              {completionPercentage >= 100 ? (
                <p className="text-blue-700">🎉 Félicitations ! Votre dossier est complet et prêt pour candidater.</p>
              ) : (
                <p className="text-blue-700">
                  Il vous reste {requiredTotal - requiredCompleted} élément(s) obligatoire(s) à compléter pour finaliser
                  votre dossier.
                  {optionalTotal - optionalCompleted > 0 &&
                    ` Vous pouvez également ajouter ${optionalTotal - optionalCompleted} élément(s) optionnel(s) pour renforcer votre candidature.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
