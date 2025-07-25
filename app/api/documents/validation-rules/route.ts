import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Configuration des règles de validation par défaut
const DEFAULT_VALIDATION_RULES = {
  identity: {
    required_fields: ["full_name", "birth_date", "expiration_date"],
    optional_fields: ["document_number", "birth_place"],
    validation_rules: [
      {
        field: "expiration_date",
        type: "date_future",
        message: "La pièce d'identité doit être valide",
      },
      {
        field: "birth_date",
        type: "date_past",
        message: "La date de naissance doit être dans le passé",
      },
    ],
  },
  tax_notice: {
    required_fields: ["taxpayer_name", "fiscal_year", "annual_revenue"],
    optional_fields: ["tax_parts", "taxable_income"],
    validation_rules: [
      {
        field: "fiscal_year",
        type: "recent_year",
        max_age_years: 2,
        message: "L'avis d'imposition doit être récent",
      },
      {
        field: "annual_revenue",
        type: "positive_number",
        message: "Le revenu doit être un nombre positif",
      },
    ],
  },
  payslip: {
    required_fields: ["employee_name", "employer_name", "net_salary"],
    optional_fields: ["gross_salary", "pay_period"],
    validation_rules: [
      {
        field: "net_salary",
        type: "positive_number",
        message: "Le salaire net doit être positif",
      },
      {
        field: "pay_period",
        type: "recent_date",
        max_age_months: 6,
        message: "La fiche de paie doit être récente",
      },
    ],
  },
  bank_statement: {
    required_fields: ["account_holder", "statement_period"],
    optional_fields: ["balance", "account_number"],
    validation_rules: [
      {
        field: "statement_period",
        type: "recent_period",
        max_age_months: 3,
        message: "Le relevé bancaire doit être récent",
      },
    ],
  },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get("documentType")

    if (documentType) {
      // Retourner les règles pour un type spécifique
      const rules = DEFAULT_VALIDATION_RULES[documentType as keyof typeof DEFAULT_VALIDATION_RULES]

      if (!rules) {
        return NextResponse.json({ error: `Type de document non supporté: ${documentType}` }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: {
          document_type: documentType,
          ...rules,
        },
      })
    }

    // Retourner toutes les règles
    return NextResponse.json({
      success: true,
      data: DEFAULT_VALIDATION_RULES,
    })
  } catch (error) {
    console.error("❌ Erreur récupération règles:", error)

    return NextResponse.json({ error: "Erreur lors de la récupération des règles de validation" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, documentType, customRules } = body

    // Vérifier que l'utilisateur est admin
    const { data: user, error: userError } = await supabase.from("users").select("user_type").eq("id", userId).single()

    if (userError || !user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Sauvegarder les règles personnalisées
    const { error: saveError } = await supabase.from("custom_validation_rules").upsert({
      document_type: documentType,
      rules: customRules,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })

    if (saveError) {
      throw saveError
    }

    return NextResponse.json({
      success: true,
      message: "Règles de validation mises à jour",
    })
  } catch (error) {
    console.error("❌ Erreur sauvegarde règles:", error)

    return NextResponse.json({ error: "Erreur lors de la sauvegarde des règles" }, { status: 500 })
  }
}
