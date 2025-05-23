import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Simulation d'une base de données pour les biens
const properties: any[] = [
  {
    id: "1",
    title: "Appartement 3 pièces - Centre ville",
    description: "Magnifique appartement de 75m² en centre ville avec balcon",
    price: 1200,
    surface: 75,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    address: "15 rue de la République, 69001 Lyon",
    city: "Lyon",
    postalCode: "69001",
    type: "apartment",
    furnished: true,
    available: true,
    ownerId: "owner1",
    images: ["/placeholder.svg?height=300&width=400"],
    amenities: ["balcony", "parking", "elevator"],
    createdAt: "2024-01-15T10:00:00Z",
  },
]

function verifyToken(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
  } catch {
    return null
  }
}

// GET - Récupérer un bien spécifique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const property = properties.find((p) => p.id === params.id)

    if (!property) {
      return NextResponse.json({ error: "Bien non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error("Erreur lors de la récupération du bien:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// PUT - Modifier un bien (propriétaire uniquement)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(request)

    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
    }

    const propertyIndex = properties.findIndex((p) => p.id === params.id)

    if (propertyIndex === -1) {
      return NextResponse.json({ error: "Bien non trouvé" }, { status: 404 })
    }

    const property = properties[propertyIndex]

    // Vérifier que l'utilisateur est le propriétaire du bien
    if (property.ownerId !== (user as any).userId && (user as any).userType !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()

    // Mettre à jour le bien
    properties[propertyIndex] = {
      ...property,
      ...body,
      id: params.id, // S'assurer que l'ID ne change pas
      ownerId: property.ownerId, // S'assurer que le propriétaire ne change pas
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      message: "Bien mis à jour avec succès",
      property: properties[propertyIndex],
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du bien:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un bien (propriétaire uniquement)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(request)

    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
    }

    const propertyIndex = properties.findIndex((p) => p.id === params.id)

    if (propertyIndex === -1) {
      return NextResponse.json({ error: "Bien non trouvé" }, { status: 404 })
    }

    const property = properties[propertyIndex]

    // Vérifier que l'utilisateur est le propriétaire du bien
    if (property.ownerId !== (user as any).userId && (user as any).userType !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Supprimer le bien
    properties.splice(propertyIndex, 1)

    return NextResponse.json({
      message: "Bien supprimé avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la suppression du bien:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
