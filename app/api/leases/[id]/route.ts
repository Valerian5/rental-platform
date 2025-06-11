import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: lease, error } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!tenant_id(*),
        owner:users!owner_id(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Erreur récupération bail:", error)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    if (user.user_type === "tenant" && lease.tenant_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    if (user.user_type === "owner" && lease.owner_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ success: true, lease })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Vérifier que le bail existe et que l'utilisateur a les droits
    const { data: lease, error: fetchError } = await supabase.from("leases").select("*").eq("id", params.id).single()

    if (fetchError) {
      console.error("Erreur récupération bail:", fetchError)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    if (user.user_type === "owner" && lease.owner_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    if (user.user_type === "tenant" && lease.tenant_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Mettre à jour le bail
    const { data: updatedLease, error } = await supabase
      .from("leases")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour bail:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour du bail" }, { status: 500 })
    }

    return NextResponse.json({ success: true, lease: updatedLease })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
