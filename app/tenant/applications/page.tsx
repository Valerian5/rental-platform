"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import type { Application, Property } from "@prisma/client"
import { format, parseISO } from "date-fns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ApplicationWithProperty extends Application {
  property: Property | null
}

const Page = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null)

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const response = await fetch("/api/tenant/applications")
      if (!response.ok) {
        throw new Error("Failed to fetch applications")
      }
      return (await response.json()) as ApplicationWithProperty[]
    },
  })

  const deleteApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await fetch(`/api/tenant/applications/${applicationId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete application")
      }
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      toast({
        title: "Success",
        description: "Application deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleApplicationAction = async (action: "contact_owner" | "delete", application: ApplicationWithProperty) => {
    switch (action) {
      case "delete":
        setApplicationToDelete(application.id)
        setOpen(true)
        break
      case "contact_owner":
        // Rediriger vers la messagerie avec les paramètres appropriés
        const property = application.property
        if (property && property.owner_id) {
          router.push(`/tenant/messaging?owner_id=${property.owner_id}&property_id=${property.id}`)
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de contacter le propriétaire",
            variant: "destructive",
          })
        }
        break
    }
  }

  const confirmDelete = async () => {
    if (applicationToDelete) {
      await deleteApplicationMutation.mutateAsync(applicationToDelete)
      setOpen(false)
      setApplicationToDelete(null)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">My Applications</h1>

      {isLoading ? (
        <p>Loading applications...</p>
      ) : applications && applications.length > 0 ? (
        <Table>
          <TableCaption>A list of your applications.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Created At</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  {format(parseISO(application.createdAt.toISOString()), "PPP")}
                </TableCell>
                <TableCell>{application.property?.name || "Property not found"}</TableCell>
                <TableCell>{application.status}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Récupérer l'owner_id depuis la propriété
                      const ownerId = application.property.owner?.id
                      if (ownerId && application.property.id) {
                        router.push(`/tenant/messaging?owner_id=${ownerId}&property_id=${application.property.id}`)
                      } else {
                        toast.error("Impossible de contacter le propriétaire - informations manquantes")
                      }
                    }}
                  >
                    Contacter le propriétaire
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleApplicationAction("delete", application)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No applications found.</p>
      )}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your application and remove your data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setApplicationToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Page
