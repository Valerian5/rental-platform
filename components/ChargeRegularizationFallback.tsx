"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function ChargeRegularizationFallback() {
  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Chargement des données de régularisation
        </CardTitle>
        <CardDescription>
          Veuillez patienter pendant le chargement des paramètres de charges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Configuration des charges en cours...</p>
        </div>
      </CardContent>
    </Card>
  )
}
