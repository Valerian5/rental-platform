"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Settings } from "lucide-react"
import Link from "next/link"

interface Property {
  id: string
  name: string
  address: string
  // Add other property fields as needed
}

const OwnerDashboardPage = () => {
  const [properties, setProperties] = useState<Property[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true)
      try {
        // Replace with your actual API endpoint
        const response = await fetch("/api/owner/properties")
        if (!response.ok) {
          throw new Error("Failed to fetch properties")
        }
        const data = await response.json()
        setProperties(data)
      } catch (error: any) {
        console.error("Error fetching properties:", error)
        toast({
          title: "Error",
          description: "Failed to load properties.",
          variant: "destructive",
        })
        setProperties([]) // Ensure properties is not null to avoid errors
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [toast])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Propriétaire</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton loading state
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-4/5" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-3/5" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
                <div className="mt-4 flex justify-end">
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : properties === null ? (
          <div>Error loading properties.</div>
        ) : properties.length === 0 ? (
          <div>No properties found.</div>
        ) : (
          properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle>{property.name}</CardTitle>
                <CardDescription>{property.address}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add more property details here if needed */}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/owner/properties/${property.id}`}>
                    <Settings className="h-4 w-4 mr-1" />
                    Gérer
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default OwnerDashboardPage
