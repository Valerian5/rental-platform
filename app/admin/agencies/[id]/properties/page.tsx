"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home,
  ChevronLeft,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Loader2,
  Building2,
  MapPin,
  Euro,
  Bed,
  Bath,
  Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"
import { agencyApi, authenticatedFetch } from "@/lib/api-client"

interface Agency {
  id: string
  name: string
  logo_url?: string
}

interface Property {
  id: string
  title: string
  description?: string
  address?: string
  city: string
  postal_code?: string
  property_type: string
  price: number
  area: number
  bedrooms: number
  bathrooms: number
  status: string
  agency_reference?: string
  created_at: string
  owner?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export default function AgencyPropertiesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    checkAdminAuth()
    fetchAgencyProperties()
  }, [params.id])

  const checkAdminAuth = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user || user.user_type !== "admin") {
        toast({
          title: "Access denied",
          description: "You don't have administrator permissions",
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Error checking admin auth:", error)
      router.push("/login")
    }
  }

  const fetchAgencyProperties = async () => {
    try {
      setLoading(true)

      // Fetch agency details
      const agencyResult = await agencyApi.getById(params.id)
      if (!agencyResult.success) {
        throw new Error(agencyResult.error || "Failed to fetch agency details")
      }
      setAgency(agencyResult.agency)

      // Fetch agency properties
      const propertiesResult = await authenticatedFetch(`/api/agencies/${params.id}/properties`)
      if (!propertiesResult.success) {
        throw new Error(propertiesResult.error || "Failed to fetch agency properties")
      }
      setProperties(propertiesResult.properties || [])
    } catch (error) {
      console.error("Error fetching agency properties:", error)
      toast({
        title: "Error",
        description: "Failed to load agency properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "rented":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "unavailable":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "apartment":
        return "Apartment"
      case "house":
        return "House"
      case "studio":
        return "Studio"
      case "loft":
        return "Loft"
      case "duplex":
        return "Duplex"
      default:
        return type
    }
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.property_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.agency_reference?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!agency) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Agency not found</h3>
          <p className="text-muted-foreground mb-4">The requested agency could not be found</p>
          <Button asChild>
            <Link href="/admin/agencies">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Agencies
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/agencies/${params.id}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Home className="h-6 w-6" />
              Agency Properties
            </h1>
            <p className="text-muted-foreground">Properties managed by {agency.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/agencies/${params.id}/properties/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "This agency doesn't have any properties yet"}
            </p>
            {!searchQuery && (
              <Button className="mt-4" asChild>
                <Link href={`/admin/agencies/${params.id}/properties/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Property
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.city}
                      {property.agency_reference && (
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          Ref: {property.agency_reference}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/properties/${property.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Property
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/properties/${property.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Property
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Property
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
                  <span className="text-sm text-muted-foreground">{getPropertyTypeLabel(property.property_type)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">€{property.price.toLocaleString()}/month</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <span>{property.area}m²</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    <span>{property.bathrooms}</span>
                  </div>
                </div>

                {property.owner && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="text-sm font-medium">
                      {property.owner.first_name} {property.owner.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{property.owner.email}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Added {new Date(property.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
