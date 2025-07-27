import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("📝 API validation document appelée")

    const body = await request.json()
    const { documentType, extractedText, confidence, fields, userId } = body

    console.log("📋 Données reçues:", {
      documentType,
      textLength: extractedText?.length || 0,
      confidence,
      fieldsCount: fields?.length || 0,
      userId,
    })

    // Vérifier si l'utilisateur existe, sinon le créer
    let user = null
    if (userId) {
      const { data: existingUser } = await supabase.from("users").select("*").eq("id", userId).single()

      if (existingUser) {
        user = existingUser
      } else {
        // Créer un utilisateur temporaire pour les tests
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: userId,
            email: `test-${userId}@example.com`,
            user_type: "tenant",
            first_name: "Test",
            last_name: "User",
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          console.error("❌ Erreur création utilisateur:", createError)
          return NextResponse.json({ error: "Impossible de créer l'utilisateur" }, { status: 500 })
        }

        user = newUser
      }
    }

    // Sauvegarder la validation du document
    const validationData = {
      user_id: user?.id || null,
      document_type: documentType,
      extracted_text: extractedText,
      ocr_confidence: confidence,
      extracted_fields: fields || [],
      validation_status: confidence > 0.8 ? "validated" : "needs_review",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: validation, error: validationError } = await supabase
      .from("document_validations")
      .insert(validationData)
      .select()
      .single()

    if (validationError) {
      console.error("❌ Erreur sauvegarde validation:", validationError)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    console.log("✅ Validation sauvegardée:", validation.id)

    // Analyser les champs extraits pour fournir un feedback
    const analysis = analyzeExtractedFields(fields, documentType)

    return NextResponse.json({
      success: true,
      validationId: validation.id,
      status: validation.validation_status,
      analysis,
      extractedFields: fields,
      confidence,
      message: "Document validé avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API validation:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

function analyzeExtractedFields(fields: any[], documentType: string) {
  if (!fields || fields.length === 0) {
    return {
      score: 0,
      message: "Aucun champ extrait",
      recommendations: ["Vérifiez la qualité de l'image", "Essayez avec un autre document"],
    }
  }

  const validFields = fields.filter((f) => f.value && f.confidence > 0.5)
  const score = Math.round((validFields.length / fields.length) * 100)

  let message = ""
  const recommendations = []

  if (score >= 80) {
    message = "Extraction excellente"
  } else if (score >= 60) {
    message = "Extraction correcte"
    recommendations.push("Vérifiez les champs avec une faible confiance")
  } else {
    message = "Extraction partielle"
    recommendations.push("Améliorez la qualité de l'image")
    recommendations.push("Vérifiez que le document est bien orienté")
  }

  return {
    score,
    message,
    recommendations,
    validFieldsCount: validFields.length,
    totalFieldsCount: fields.length,
  }
}
