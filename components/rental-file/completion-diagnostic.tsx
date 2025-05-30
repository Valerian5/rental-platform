"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Info } from "lucide-react"
import { rentalFileService } from "@/lib/rental-file-service"

interface CompletionDiagnosticProps {
  rentalFile: any
}

export function CompletionDiagnostic({ rentalFile }: CompletionDiagnosticProps) {
  const diagnostic = rentalFileService.getDiagnostic(rentalFile)
  const completionPercentage = rentalFile?.completion_percentage || 0

  const requiredCompleted = diagnostic.required.filter((item) => item.completed).length
  const requiredTotal = diagnostic.required.length
  const optionalCompleted = diagnostic.optional.filter((item) => item.completed).length
  const optionalTotal = diagnostic.optional.length

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
        {/* Progression globale */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression globale</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Éléments obligatoires */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Éléments obligatoires</h4>
            <Badge variant={requiredCompleted === requiredTotal ? "default" : "secondary"}>
              {requiredCompleted}/{requiredTotal}
            </Badge>
          </div>

          <div className="space-y-2">
            {diagnostic.required.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.item}</p>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </div>
                <Badge variant={item.completed ? "default" : "destructive"} className="text-xs">
                  {item.category}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Éléments optionnels */}
        {diagnostic.optional.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Éléments optionnels (recommandés)</h4>
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
