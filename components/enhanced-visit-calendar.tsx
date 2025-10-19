"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Building, CheckCircle, XCircle } from "lucide-react"
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
  is_edl_exit?: boolean
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

  const normalizeTime = (t?: string) => {
    if (!t) return "00:00"
    // Accepte "HH:MM" ou "HH:MM:SS"
    const m = t.match(/^(\d{2}:\d{2})(:\d{2})?$/)
    return m ? m[1] : t
  }

  const startTime = (v: Visit) => normalizeTime(v.start_time || v.visit_time)
  const endTime = (v: Visit) => (v.end_time ? normalizeTime(v.end_time) : null)

  const isPastVisit = (v: Visit) => {
    // Si visit_date contient déjà une heure (ISO), on l'utilise telle quelle
    if (v.visit_date?.includes("T")) {
      const start = new Date(v.visit_date)
      const end = v.end_time
        ? new Date(`${v.visit_date.split("T")[0]}T${endTime(v)}:00`)
        : new Date(start.getTime() + 30 * 60 * 1000)
      return end.getTime() < Date.now()
    }

    // Sinon on compose avec start_time/visit_time
    const startISO = `${v.visit_date}T${startTime(v)}:00`
    const start = new Date(startISO)
    const end = v.end_time
      ? new Date(`${v.visit_date}T${endTime(v)}:00`)
      : new Date(start.getTime() + 30 * 60 * 1000)
    return end.getTime() < Date.now()
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

  // Marqueurs de calendrier
  const hasVisitsOnDate = (date: Date) =>
    visits.some((v) => new Date(v.visit_date).toDateString() === date.toDateString())

  const getVisitCountForDate = (date: Date) =>
    visits.filter((v) => new Date(v.visit_date).toDateString() === date.toDateString()).length

  // Liste triée
  const sortedAll = useMemo(
    () =>
      [...visits].sort((a, b) => {
        const da = new Date(a.visit_date).getTime()
        const db = new Date(b.visit_date).getTime()
        if (da !== db) return da - db
        return startTime(a).localeCompare(startTime(b))
      }),
    [visits],
  )

  const dayMatches = (v: Visit, d: Date) =>
    new Date(v.visit_date).toDateString() === d.toDateString()

  const visibleVisits = useMemo(() => {
    if (!selectedDate) return sortedAll
    return sortedAll.filter((v) => dayMatches(v, selectedDate))
  }, [sortedAll, selectedDate])

  const handleDaySelect = (d?: Date) => {
    if (!d) {
      setSelectedDate(undefined)
      return
    }
    // Toggle sur même jour => affiche tout
    if (selectedDate && selectedDate.toDateString() === d.toDateString()) {
      setSelectedDate(undefined)
    } else {
      setSelectedDate(d)
    }
  }

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
              onSelect={handleDaySelect}
              className="rounded-md border"
              hasVisitsOnDate={hasVisitsOnDate}
              getVisitCountForDate={getVisitCountForDate}
            />
            {selectedDate && (
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)}>
                  Afficher tout
                </Button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {visibleVisits.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {selectedDate ? "Aucun créneau pour ce jour" : "Aucune visite programmée"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleVisits.map((v) => {
                  const dateLabel = new Date(v.visit_date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                  const times = endTime(v) ? `${startTime(v)} - ${endTime(v)}` : startTime(v)
                  const past = isPastVisit(v)
                  const canMarkDone = past && (v.status === "scheduled" || v.status === "confirmed")

                  return (
                    <div key={v.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium truncate">{times}</span>
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

                          {v.is_edl_exit && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                              EDL Sortie
                            </Badge>
                          )}

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

                      {/* Feedback propriétaire */}
                      {v.status === "completed" &&
                        userType === "owner" &&
                        (showOwnerFeedbackFor === v.id || v.owner_feedback == null) && (
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

                      {/* Feedback locataire */}
                      {v.status === "completed" &&
                        userType === "tenant" &&
                        (showTenantFeedbackFor === v.id || v.tenant_feedback == null) && (
                          <div className="mt-3">
                            <TenantVisitFeedback
                              visit={v}
                              onFeedbackSubmit={async (visitId, feedback) => {
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