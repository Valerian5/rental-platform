import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Simulation d'une base de données pour les candidatures
const applications: any[] = []

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

// GET - Récupérer les candidatures
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)

    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const status = searchParams.get("status")

    let filteredApplications = applications

    // Filtrer selon le type d'utilisateur
    if ((user as any).userType === "tenant") {
      filteredApplications = applications.filter((app) => app.tenantId === (user as any).userId)
    } else if ((user as any).userType === "owner") {
      filteredApplications = applications.filter((app) => app.ownerId === (user as any).userId)
    }

    // Appliquer les filtres supplémentaires
    if (propertyId) {
      filteredApplications = filteredApplications.filter((app) => app.propertyId === propertyId)
    }
    if (status) {
      filteredApplications = filteredApplications.filter((app) => app.status === status)
    }

    return NextResponse.json({
      applications: filteredApplications,
      total: filteredApplications.length,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des candidatures:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle candidature (locataires uniquement)
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)

    if (!user || (user as any).userType !== "tenant") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, ownerId, message, documents, income, profession, guarantor } = body

    // Validation des données
    if (!propertyId || !ownerId) {
      return NextResponse.json({ error: "Informations manquantes" }, { status: 400 })
    }

    // Vérifier si une candidature existe déjà pour ce bien
    const existingApplication = applications.find(
      (app) => app.propertyId === propertyId && app.tenantId === (user as any).userId,
    )

    if (existingApplication) {
      return NextResponse.json({ error: "Vous avez déjà postulé pour ce bien" }, { status: 409 })
    }

    // Créer la nouvelle candidature
    const newApplication = {
      id: Date.now().toString(),
      propertyId,
      tenantId: (user as any).userId,
      ownerId,
      message,
      documents: documents || [],
      income,
      profession,
      guarantor,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    applications.push(newApplication)

    return NextResponse.json(
      {
        message: "Candidature envoyée avec succès",
        application: newApplication,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de la création de la candidature:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
