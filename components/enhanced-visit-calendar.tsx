"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, User, Building } from "lucide-react"
import { PostVisitManager } from "./post-visit-manager"

interface Visit {
  id: string
  visit_date: string
  visit_time: string
  start_time?: string
  end_time?: string
  status: string
  visitor_name: string
  tenant_email?: string
  visitor_phone?: string
  property: {
    id: string
    title: string
    address: string
    city: string
    property_images?: Array<{ url: string; is_primary: boolean }>
  }
  application?: {
    id: string
    status: string
  }
  tenant_interest?: "interested" | "not_interested"
  feedback?: {
    rating: number
    comment: string
    submitted_at: string
  }
}

interface EnhancedVisitCalendarProps {
  visits: Visit[]
  userType: "owner" | "tenant"
  onVisitUpdate: (visitId: string, updates: any) => void
}

export function EnhancedVisitCalendar({ visits, userType, onVisitUpdate }: EnhancedVisitCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>(visits)

  useEffect(() => {
    setFilteredVisits(visits)
  }, [visits])

  const hasVisitsOnDate = (date: Date) => {
    return filteredVisits.some((visit) => {
      const visitDate = new Date(visit.visit_date)
      return visitDate.toDateString() === date.toDateString()
    })
  }

  const getVisitCountForDate = (date: Date) => {
    return filteredVisits.filter((visit) => {
      const visitDate = new Date(visit.visit_date)
      return visitDate.toDateString() === date.toDateString()
    }).length
  }

  const getVisitsForDate = (date: Date) => {
    return filteredVisits.filter((visit) => {
      const visitDate = new Date(visit.visit_date)
      return visitDate.toDateString() === date.toDateString()
    }).sort((a, b) => {
      const timeA = a.start_time || a.visit_time || "00:00"
      const timeB = b.start_time || b.visit_time || "00:00"
      return timeA.localeCompare(timeB)
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Programmée", variant: "default" as const },
      confirmed: { label: "Confirmée", variant: "default" as const },
      completed: { label: "Terminée", variant: "outline" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
      interested: { label: "Intéressé", variant: "default" as const },
      not_interested: { label: "Pas intéressé", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const formatTime = (time: string) => {
    if (!time) return "00:00"
    // Si le temps est au format HH:MM, on le retourne tel quel
    if (time.match(/^\d{2}:\d{2}$/)) return time
    // Sinon on essaie de le formater
    return time
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendrier des visites</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendrier */}
            <div className="lg:col-span-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                hasVisitsOnDate={hasVisitsOnDate}
                getVisitCountForDate={getVisitCountForDate}
              />
            </div>

            {/* Détails des visites */}
            <div className="lg:col-span-2">
              {selectedDate ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    Visites du {selectedDate.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  
                  {(() => {
                    const dayVisits = getVisitsForDate(selectedDate)

                    if (dayVisits.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Aucune visite ce jour</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        {dayVisits.map((visit) => (
                          <Card key={visit.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              {/* En-tête avec horaire et statut */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">
                                    {formatTime(visit.start_time || visit.visit_time)}
                                    {visit.end_time && ` - ${formatTime(visit.end_time)}`}
                                  </span>
                                </div>
                                {getStatusBadge(visit.status)}
                              </div>

                              {/* Informations de la propriété */}
                              <div className="mb-3">
                                <h4 className="font-semibold text-sm mb-1">{visit.property.title}</h4>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {visit.property.address}, {visit.property.city}
                                </div>
                              </div>

                              {/* Informations du visiteur */}
                              <div className="mb-3">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {visit.visitor_name || "Visiteur"}
                                </div>
                                {visit.tenant_email && (
                                  <div className="text-sm text-muted-foreground">
                                    {visit.tenant_email}
                                  </div>
                                )}
                              </div>

                              {/* Gestion post-visite si la visite est terminée */}
                              {visit.status === "completed" && (
                                <PostVisitManager
                                  visit={visit}
                                  onVisitUpdate={onVisitUpdate}
                                  userType={userType}
                                />
                              )}

                              {/* Actions rapides */}
                              <div className="flex gap-2 mt-3">
                                {visit.application && (
                                  <Button variant="outline" size="sm" className="flex-1">
                                    <Building className="h-4 w-4 mr-2" />
                                    Voir candidature
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Détails visite
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Prochaines visites</h3>
                  {(() => {
                    const upcomingVisits = filteredVisits
                      .filter((visit) => {
                        const visitDate = new Date(visit.visit_date)
                        return visitDate >= new Date() && ["scheduled", "confirmed"].includes(visit.status)
                      })
                      .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
                      .slice(0, 5)

                    if (upcomingVisits.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Aucune visite programmée à venir</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Sélectionnez une date dans le calendrier pour voir les visites
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-3">
                        {upcomingVisits.map((visit) => (
                          <div
                            key={visit.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedDate(new Date(visit.visit_date))}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {formatTime(visit.start_time || visit.visit_time)}
                                </span>
                              </div>
                              {getStatusBadge(visit.status)}
                            </div>
                            <p className="text-sm font-medium truncate">{visit.property.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {visit.property.address}, {visit.property.city}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {visit.visitor_name || "Visiteur"}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {new Date(visit.visit_date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground text-center mt-4">
                          Cliquez sur une visite ou sélectionnez une date dans le calendrier
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}