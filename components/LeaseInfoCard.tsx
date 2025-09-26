"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, User, Calendar, Euro } from "lucide-react"

interface Lease {
  id: string
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  property: {
    title: string
    address: string
    city: string
  }
  tenant: {
    first_name: string
    last_name: string
    email: string
  }
}

interface LeaseInfoCardProps {
  lease: Lease
  year: number
  daysOccupied: number
}

export function LeaseInfoCard({ lease, year, daysOccupied }: LeaseInfoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getYearPeriod = (year: number) => {
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31)
    const leaseStart = new Date(lease.start_date)
    const leaseEnd = new Date(lease.end_date)
    
    const periodStart = leaseStart > startOfYear ? leaseStart : startOfYear
    const periodEnd = leaseEnd < endOfYear ? leaseEnd : endOfYear
    
    return {
      start: periodStart,
      end: periodEnd
    }
  }

  const yearPeriod = getYearPeriod(year)
  const prorataPercentage = (daysOccupied / 365) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Informations du bail</span>
        </CardTitle>
        <CardDescription>
          Période d'occupation pour l'année {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Logement */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Logement</h4>
            <div className="text-sm text-gray-900">
              <div className="font-medium">{lease.property.title}</div>
              <div className="text-gray-600">{lease.property.address}</div>
              <div className="text-gray-600">{lease.property.city}</div>
            </div>
          </div>

          {/* Locataire */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Locataire</h4>
            <div className="text-sm text-gray-900">
              <div className="font-medium">
                {lease.tenant.first_name} {lease.tenant.last_name}
              </div>
              <div className="text-gray-600">{lease.tenant.email}</div>
            </div>
          </div>

          {/* Période d'occupation */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Période d'occupation</h4>
            <div className="text-sm text-gray-900">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(yearPeriod.start.toISOString())} → {formatDate(yearPeriod.end.toISOString())}
                </span>
              </div>
              <div className="text-gray-600">
                {daysOccupied} jour{daysOccupied > 1 ? 's' : ''} ({prorataPercentage.toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Provisions mensuelles */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Provisions mensuelles</h4>
            <div className="text-sm text-gray-900">
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4" />
                <span className="font-medium">{lease.charges.toFixed(2)} €</span>
              </div>
              <div className="text-gray-600">
                Loyer : {lease.monthly_rent.toFixed(2)} €
              </div>
            </div>
          </div>
        </div>

        {/* Badge de statut */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Prorata calculé sur {daysOccupied} jour{daysOccupied > 1 ? 's' : ''} d'occupation
            </span>
            <Badge variant={prorataPercentage === 100 ? "default" : "secondary"}>
              {prorataPercentage.toFixed(1)}% de l'année
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
