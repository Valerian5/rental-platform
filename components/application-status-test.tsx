import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useApplicationStatus } from "@/hooks/use-application-status"
import { ApplicationStatusBadge } from "@/components/application-badge"
import { authService } from "@/lib/auth-service"

export function ApplicationStatusTest() {
  const [userId, setUserId] = useState<string | null>(null)
  const [propertyId, setPropertyId] = useState("")
  const [applicationStatus, setApplicationStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { checkApplicationStatus, hasApplied, getStatus } = useApplicationStatus()

  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  const handleCheckStatus = async () => {
    if (!userId || !propertyId) {
      toast.error("User ID and Property ID are required.")
      return
    }
    setLoading(true)
    try {
      const status = await checkApplicationStatus(propertyId, userId)
      setApplicationStatus(status)
      toast.success(`Application status checked for property ${propertyId}.`)
    } catch (error) {
      console.error("Error checking application status:", error)
      toast.error("Failed to check application status.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p>Current User ID: {userId || "Not logged in"}</p>
      <Input
        placeholder="Enter Property ID"
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={handleCheckStatus} disabled={loading}>
          Check Application Status
        </Button>
      </div>
      {applicationStatus && (
        <div className="space-y-2">
          <p>Has Applied: {applicationStatus.hasApplied ? "Yes" : "No"}</p>
          {applicationStatus.status && (
            <p>Status: {applicationStatus.status}</p>
          )}
          {applicationStatus.appliedAt && (
            <p>Applied At: {new Date(applicationStatus.appliedAt).toLocaleString()}</p>
          )}
          <div className="flex items-center gap-2">
            <span>Badge Preview:</span>
            <ApplicationStatusBadge
              hasApplied={applicationStatus.hasApplied}
              status={applicationStatus.status}
            />
          </div>
        </div>
      )}
    </div>
  )
}
