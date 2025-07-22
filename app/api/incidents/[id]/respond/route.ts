import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📝 API incidents/[id]/respond - Ajout réponse incident:", params.id)

    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentification requise",
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { message, attachments = [] } = body

    if (!message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Le message est requis",
        },
        { status: 400 },
      )
    }

    // Vérifier que l'incident existe et appartient au locataire
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select(`
        *,
        lease:leases!inner(tenant_id, owner_id)
      `)
      .eq("id", params.id)
      .single()

    if (incidentError || !incident) {
      return NextResponse.json(
        {
          success: false,
          error: "Incident non trouvé",
        },
        { status: 404 },
      )
    }

    // Vérifier les permissions (locataire ou propriétaire)
    const userId = (user as any).userId
    const userType = (user as any).userType

    if (userType === "tenant" && incident.lease.tenant_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès non autorisé",
        },
        { status: 403 },
      )
    }

    if (userType === "owner" && incident.lease.owner_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès non autorisé",
        },
        { status: 403 },
      )
    }

    // Récupérer le nom de l'utilisateur
    const { data: userData } = await supabase.from("users").select("first_name, last_name").eq("id", userId).single()

    const authorName = userData ? `${userData.first_name} ${userData.last_name}` : "Utilisateur"

    // Créer la réponse
    const { data: response, error: responseError } = await supabase
      .from("incident_responses")
      .insert({
        incident_id: params.id,
        message: message.trim(),
        author_type: userType,
        author_id: userId,
        author_name: authorName,
        attachments: attachments.length > 0 ? attachments : null,
      })
      .select()
      .single()

    if (responseError) {
      console.error("❌ Erreur création réponse:", responseError)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'ajout de la réponse",
        },
        { status: 500 },
      )
    }

    // Mettre à jour la date de dernière modification de l'incident
    await supabase.from("incidents").update({ updated_at: new Date().toISOString() }).eq("id", params.id)

    // TODO: Envoyer une notification à l'autre partie
    // Si c'est le locataire qui répond, notifier le propriétaire et vice versa

    console.log("✅ Réponse ajoutée avec succès")

    return NextResponse.json({
      success: true,
      response,
      message: "Réponse ajoutée avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 },
    )
  }
}
