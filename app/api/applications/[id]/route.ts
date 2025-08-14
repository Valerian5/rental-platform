import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

// GET - Récupérer une candidature par ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id

    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code,
          rent,
          bedrooms,
          bathrooms,
          surface_area,
          property_images(
            id,
            url,
            is_primary
          )
        ),
        tenant:users(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("id", applicationId)
      .single()

    if (error) {
      console.error("❌ Erreur récupération candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Mettre à jour une candidature
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id
    const body = await request.json()

    const { data: application, error } = await supabase
      .from("applications")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur mise à jour candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Candidature mise à jour avec succès",
      application,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Retirer une candidature (marquer comme withdrawn)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id

    // Marquer la candidature comme retirée au lieu de la supprimer
    const { data: application, error } = await supabase
      .from("applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur retrait candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Candidature retirée avec succès",
      application,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
