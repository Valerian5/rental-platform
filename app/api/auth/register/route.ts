import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// Simulation d'une base de données (à remplacer par votre vraie DB)
const users: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, userType, phone } = body

    // Validation des données
    if (!email || !password || !firstName || !lastName || !userType) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find((user) => user.email === email)
    if (existingUser) {
      return NextResponse.json({ error: "Un compte avec cet email existe déjà" }, { status: 409 })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userType, // 'tenant' ou 'owner'
      phone,
      createdAt: new Date().toISOString(),
      isVerified: false,
    }

    users.push(newUser)

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: userWithoutPassword,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
