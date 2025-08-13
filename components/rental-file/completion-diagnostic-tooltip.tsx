"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { rentalFileService } from "@/lib/rental-file-service"

interface CompletionDiagnosticTooltipProps {
  rentalFile: any
}

export function CompletionDiagnosticTooltip({ rentalFile }: CompletionDiagnosticTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const diagnostic = rentalFileService.getDiagnostic(rentalFile)
  const completionPercentage = rentalFile?.completion_percentage || 0

  const missingRequired = diagnostic.required.filter((item) => !item.completed)

  return (
    <div className="relative">
      <div onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} className="cursor-help">
        <Badge variant={completionPercentage >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
          {completionPercentage}% complété
        </Badge>
      </div>

      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50 w-80">
          <Card className="shadow-lg border-2">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Diagnostic de complétude</h4>
                  <Badge variant={completionPercentage >= 100 ? "default" : "secondary"}>{completionPercentage}%</Badge>
                </div>

                {missingRequired.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-800">
                        {missingRequired.length} élément(s) manquant(s)
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {missingRequired.slice(0, 5).map((item, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-amber-50 p-2 rounded">
                          <span className="font-medium">{item.item}</span>
                          <br />
                          <span className="text-gray-500">{item.description}</span>
                        </div>
                      ))}
                      {missingRequired.length > 5 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          ... et {missingRequired.length - 5} autre(s)
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Tous les éléments obligatoires sont complétés !</span>
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-700">
                      {completionPercentage >= 100 ? (
                        <p>🎉 Votre dossier est complet et prêt pour candidater.</p>
                      ) : (
                        <p>Complétez les éléments manquants pour finaliser votre dossier et maximiser vos chances.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
