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

// Fonction pour vérifier le token JWT
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

// GET - Récupérer tous les biens ou filtrer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const type = searchParams.get("type")
    const rooms = searchParams.get("rooms")
    const ownerId = searchParams.get("ownerId")

    let filteredProperties = properties.filter((property) => property.available)

    // Appliquer les filtres
    if (city) {
      filteredProperties = filteredProperties.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()))
    }
    if (minPrice) {
      filteredProperties = filteredProperties.filter((p) => p.price >= Number.parseInt(minPrice))
    }
    if (maxPrice) {
      filteredProperties = filteredProperties.filter((p) => p.price <= Number.parseInt(maxPrice))
    }
    if (type) {
      filteredProperties = filteredProperties.filter((p) => p.type === type)
    }
    if (rooms) {
      filteredProperties = filteredProperties.filter((p) => p.rooms >= Number.parseInt(rooms))
    }
    if (ownerId) {
      filteredProperties = filteredProperties.filter((p) => p.ownerId === ownerId)
    }

    return NextResponse.json({
      properties: filteredProperties,
      total: filteredProperties.length,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des biens:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Créer un nouveau bien (propriétaires uniquement)
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)

    if (!user || (user as any).userType !== "owner") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      price,
      surface,
      rooms,
      bedrooms,
      bathrooms,
      address,
      city,
      postalCode,
      type,
      furnished,
      amenities,
      images,
    } = body

    // Validation des données
    if (!title || !price || !surface || !address || !city) {
      return NextResponse.json({ error: "Les champs obligatoires sont manquants" }, { status: 400 })
    }

    // Créer le nouveau bien
    const newProperty = {
      id: Date.now().toString(),
      title,
      description,
      price: Number.parseFloat(price),
      surface: Number.parseInt(surface),
      rooms: Number.parseInt(rooms),
      bedrooms: Number.parseInt(bedrooms),
      bathrooms: Number.parseInt(bathrooms),
      address,
      city,
      postalCode,
      type,
      furnished: Boolean(furnished),
      available: true,
      ownerId: (user as any).userId,
      images: images || [],
      amenities: amenities || [],
      createdAt: new Date().toISOString(),
    }

    properties.push(newProperty)

    return NextResponse.json(
      {
        message: "Bien créé avec succès",
        property: newProperty,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de la création du bien:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
