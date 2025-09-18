import { useState, useEffect } from "react"
import { applicationStatusService, ApplicationStatus } from "@/lib/application-status-service"

export function useApplicationStatus() {
  const [applicationStatuses, setApplicationStatuses] = useState<Record<string, ApplicationStatus>>({})
  const [isLoading, setIsLoading] = useState(false)

  const checkApplicationStatus = async (propertyId: string, tenantId: string) => {
    try {
      const status = await applicationStatusService.checkApplicationStatus(propertyId, tenantId)
      setApplicationStatuses(prev => ({
        ...prev,
        [propertyId]: status
      }))
      return status
    } catch (error) {
      console.error("Erreur vérification statut candidature:", error)
      return { hasApplied: false }
    }
  }

  const checkMultipleApplications = async (propertyIds: string[], tenantId: string) => {
    try {
      setIsLoading(true)
      const statuses = await applicationStatusService.checkMultipleApplications(propertyIds, tenantId)
      setApplicationStatuses(prev => ({
        ...prev,
        ...statuses
      }))
      return statuses
    } catch (error) {
      console.error("Erreur vérification statuts candidatures:", error)
      return {}
    } finally {
      setIsLoading(false)
    }
  }

  const getApplicationStatus = (propertyId: string): ApplicationStatus => {
    return applicationStatuses[propertyId] || { hasApplied: false }
  }

  const hasApplied = (propertyId: string): boolean => {
    return applicationStatuses[propertyId]?.hasApplied || false
  }

  const getStatus = (propertyId: string): string | undefined => {
    return applicationStatuses[propertyId]?.status
  }

  return {
    applicationStatuses,
    isLoading,
    checkApplicationStatus,
    checkMultipleApplications,
    getApplicationStatus,
    hasApplied,
    getStatus
  }
}
