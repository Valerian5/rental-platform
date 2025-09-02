"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Building, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { OwnerVisitFeedback } from "@/components/owner-visit-feedback"
import { TenantVisitFeedback } from "@/components/tenant-visit-feedback"

type Visit = {
  id: string
  visit_date: string
  visit_time?: string
  start_time?: string
  end_time?: string
  status: string
  visitor_name?: string
  tenant_email?: string
  property: {
    id: string
    title: string
    address: string
    city: string
    property_images?: Array<{ url: string; is_primary: boolean }>
  }
  application?: { id: string; status: string }
  tenant_interest?: "interested" | "not_interested"
  owner_feedback?: any
  tenant_feedback?: any
}

interface Props {
  visits: Visit[]
  userType: "owner" | "tenant"
  onVisitUpdate: (visitId: string, updates: any) => Promise<void>
}

export function EnhancedVisitCalendar({ visits, userType, onVisitUpdate }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showOwnerFeedbackFor, setShowOwnerFeedbackFor] = useState<string | null>(null)
  const [showTenantFeedbackFor, setShowTenantFeedbackFor] = useState<string | null>(null)

  // Fonctions utilitaires
  const getTime = (v: Visit) => v.start_time || v.visit_time || "00:00"
  const getEndTime = (v: Visit) => v.end_time || null

  const isPastVisit = (v: Visit) => {
    const dateISO = v.visit_date?.includes("T") ? v.visit_date : `${v.visit_date}T${getTime(v)}:00`
    const start = new Date(dateISO)
    const end = (() => {
      if (v.end_time) return new Date(`${v.visit_date}T${v.end_time}:00`)
      const e = new Date(start)
      e.setMinutes(e.getMinutes() + 30)
      return e
    })()
    return end < new Date()
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "outline" | "destructive" | "secondary" }> = {
      scheduled: { label: "Programmée", variant: "default" },
      confirmed: { label: "Confirmée", variant: "default" },
      completed: { label: "Terminée", variant: "outline" },
      cancelled: { label: "Annulée", variant: "destructive" },
      interested: { label: "Intéressé", variant: "default" },
      not_interested: { label: "Pas intéressé", variant: "destructive" },
    }
    const cfg = map[status] || map.scheduled
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
  }

  // Marqueur de visites sur le calendrier
  const hasVisitsOnDate = (date: Date) =>
    visits.some((v) => new Date(v.visit_date).toDateString() === date.toDateString())

  const getVisitCountForDate = (date: Date) =>
    visits.filter((v) => new Date(v.visit_date).toDateString() === date.toDateString()).length

  // Liste visible (pas de panneau filtré: requirement “Retirer la vue filtrée au clic d’un jour”)
  // On garde un clic date uniquement pour mettre en évidence, sans changer la liste.
  const sortedUpcoming = useMemo(
    () =>
      [...visits]
        .filter((v) => {
          if (v.status === "cancelled") return false
          return true
        })
        .sort((a, b) => {
          const da = new Date(a.visit_date).getTime()
          const db = new Date(b.visit_date).getTime()
          if (da !== db) return da - db
          return getTime(a).localeCompare(getTime(b))
        }),
    [visits],
  )

  const handleMarkCompletedAndOpenFeedback = async (v: Visit) => {
    try {
      await onVisitUpdate(v.id, { status: "completed" })
      toast.success("Visite marquée comme terminée")
      if (userType === "owner") setShowOwnerFeedbackFor(v.id)
      else setShowTenantFeedbackFor(v.id)
    } catch {
      toast.error("Impossible de marquer la visite comme terminée")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendrier des visites</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              // Ne filtre pas la liste, on garde juste la sélection visuelle
              onSelect={setSelectedDate}
              className="rounded-md border"
              hasVisitsOnDate={hasVisitsOnDate}
              getVisitCountForDate={getVisitCountForDate}
            />
          </div>

          <div className="lg:col-span-2">
            {sortedUpcoming.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucune visite programmée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedUpcoming.map((v) => {
                  const dateLabel = new Date(v.visit_date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                  const timeLabel = getEndTime(v) ? `${getTime(v)} - ${getEndTime(v)}` : getTime(v)
                  const past = isPastVisit(v)
                  const canMarkDone = past && (v.status === "scheduled" || v.status === "confirmed")

                  return (
                    <div key={v.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium truncate">{timeLabel}</span>
                          </div>
                          <div className="text-sm">{dateLabel}</div>
                          <div className="text-sm font-medium truncate mt-1">{v.property.title}</div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {v.property.address}, {v.property.city}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {statusBadge(v.status)}
                          {v.application && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/owner/applications/${v.application.id}`}>
                                <Building className="h-4 w-4 mr-2" />
                                Candidature
                              </a>
                            </Button>
                          )}
                          {canMarkDone && (
                            <Button size="sm" onClick={() => handleMarkCompletedAndOpenFeedback(v)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Visite effectuée
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Feedback post-visite après passage en terminé */}
                      {v.status === "completed" && userType === "owner" && (showOwnerFeedbackFor === v.id || v.owner_feedback == null) && (
                        <div className="mt-3">
                          <OwnerVisitFeedback
                            visit={v}
                            onFeedbackSubmit={async (visitId, feedback) => {
                              await onVisitUpdate(visitId, { owner_feedback: feedback })
                              toast.success("Feedback propriétaire enregistré")
                            }}
                          />
                        </div>
                      )}

                      {v.status === "completed" && userType === "tenant" && (showTenantFeedbackFor === v.id || v.tenant_feedback == null) && (
                        <div className="mt-3">
                          <TenantVisitFeedback
                            visit={v}
                            onFeedbackSubmit={async (visitId, feedback) => {
                              // Enregistrer l'intérêt locataire et feedback
                              await onVisitUpdate(visitId, {
                                tenant_feedback: feedback,
                                tenant_interest:
                                  feedback.interest === "yes"
                                    ? "interested"
                                    : feedback.interest === "no"
                                    ? "not_interested"
                                    : null,
                              })
                              toast.success("Feedback locataire enregistré")
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}