import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PropertyIdPageClient } from "./_components/property-id-page-client"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PropertyIdPageProps {
  params: {
    id: string
  }
}

const PropertyIdPage = async ({ params }: PropertyIdPageProps) => {
  const { userId } = auth()

  if (!userId) {
    redirect("/")
  }

  const property = await db.property.findUnique({
    where: {
      id: params.id,
      userId,
    },
    include: {
      amenities: {
        include: {
          amenity: true,
        },
      },
      images: true,
    },
  })

  if (!property) {
    redirect("/owner/properties")
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{property.title}</h1>
        <div className="space-x-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/owner/properties/${property.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier le bien
            </Link>
          </Button>
        </div>
      </div>
      <PropertyIdPageClient initialData={property} />
    </div>
  )
}

export default PropertyIdPage