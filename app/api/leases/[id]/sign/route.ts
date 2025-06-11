import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    const { signature_data } = data

    if (!signature_data) {
      return NextResponse.json({ error: "Données de signature manquantes" }, { status: 400 })
    }

    // Récupérer le bail
    const { data: lease, error: fetchError } = await supabase.from("leases").select("*").eq("id", params.id).single()

    if (fetchError) {
      console.error("Erreur récupération bail:", fetchError)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    if (user.user_type === "tenant" && lease.tenant_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    if (user.user_type === "owner" && lease.owner_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Mettre à jour le statut de signature
    let updateData = {}

    if (user.user_type === "tenant") {
      updateData = {
        tenant_signed: true,
        tenant_signature_date: new Date().toISOString(),
        tenant_signature_data: signature_data,
      }
    } else if (user.user_type === "owner") {
      updateData = {
        owner_signed: true,
        owner_signature_date: new Date().toISOString(),
        owner_signature_data: signature_data,
      }
    }

    const { data: updatedLease, error } = await supabase
      .from("leases")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour signature:", error)
      return NextResponse.json({ error: "Erreur lors de la signature" }, { status: 500 })
    }

    // Si les deux parties ont signé, mettre à jour le statut du bail
    if (updatedLease.tenant_signed && updatedLease.owner_signed) {
      const { error: statusError } = await supabase
        .from("leases")
        .update({
          status: "active",
          signed_date: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (statusError) {
        console.error("Erreur mise à jour statut bail:", statusError)
      }
    }

    return NextResponse.json({ success: true, lease: updatedLease })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
