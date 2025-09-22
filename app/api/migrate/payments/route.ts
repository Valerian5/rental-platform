import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const server = createServerClient()
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: userData } = await server
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Lire le script SQL
    const fs = require('fs')
    const path = require('path')
    const sqlScript = fs.readFileSync(
      path.join(process.cwd(), 'scripts', 'create-payments-tables.sql'),
      'utf8'
    )

    // Exécuter la migration
    const { error } = await server.rpc('exec_sql', { sql: sqlScript })

    if (error) {
      console.error("Erreur migration:", error)
      return NextResponse.json({ 
        error: "Erreur lors de la migration", 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Migration des tables de paiements réussie",
      tables: [
        "payments",
        "receipts", 
        "reminders",
        "lease_payment_configs"
      ]
    })

  } catch (error) {
    console.error("Erreur migration paiements:", error)
    return NextResponse.json({ 
      error: "Erreur serveur lors de la migration" 
    }, { status: 500 })
  }
}
