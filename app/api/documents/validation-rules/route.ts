import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  try {
    console.log("📋 API Récupération règles de validation")

    // Vérifier l'authentification admin
    const user = await authService.getCurrentUser()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get("documentType")

    let query = supabase.from("validation_rules").select("*")

    if (documentType) {
      query = query.eq("document_type", documentType)
    }

    const { data: rules, error } = await query.order("document_type", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      rules: rules || [],
    })
  } catch (error) {
    console.error("❌ Erreur récupération règles:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des règles",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📋 API Création règle de validation")

    // Vérifier l'authentification admin
    const user = await authService.getCurrentUser()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 })
    }

    const body = await request.json()
    const { id, document_type, field_name, rule_type, rule_config, threshold, enabled } = body

    // Validation des données
    if (!id || !document_type || !field_name || !rule_type) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    const { data: rule, error } = await supabase
      .from("validation_rules")
      .insert({
        id,
        document_type,
        field_name,
        rule_type,
        rule_config: rule_config || {},
        threshold: threshold || 0.95,
        enabled: enabled !== false,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error) {
    console.error("❌ Erreur création règle:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de la règle",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("📋 API Mise à jour règle de validation")

    // Vérifier l'authentification admin
    const user = await authService.getCurrentUser()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID de la règle requis" }, { status: 400 })
    }

    const { data: rule, error } = await supabase.from("validation_rules").update(updates).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error) {
    console.error("❌ Erreur mise à jour règle:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de la règle",
      },
      { status: 500 },
    )
  }
}
