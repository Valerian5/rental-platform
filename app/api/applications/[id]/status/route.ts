import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const applicationId = params.id
    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return NextResponse.json({ error: "Statut requis" }, { status: 400 })
    }

    console.log("📝 Mise à jour statut candidature:", { applicationId, status, userId: user.id })

    // Récupérer les détails de la candidature avec les informations de la propriété et des utilisateurs
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties!inner (
          id,
          title,
          address,
          city,
          owner_id,
          status
        ),
        tenant:users!applications_tenant_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        owner:users!properties_owner_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Erreur récupération candidature:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est soit le propriétaire soit le locataire
    const isOwner = application.property.owner_id === user.id
    const isTenant = application.tenant_id === user.id

    if (!isOwner && !isTenant) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Mettre à jour le statut de la candidature
    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    // Si la candidature est acceptée par le propriétaire, mettre à jour le statut de la propriété
    if (status === "accepted" && isOwner) {
      console.log("🏠 Candidature acceptée, mise à jour du statut de la propriété")
      
      const { error: propertyUpdateError } = await supabase
        .from("properties")
        .update({
          status: "rented", // Marquer la propriété comme louée
          updated_at: new Date().toISOString()
        })
        .eq("id", application.property.id)

      if (propertyUpdateError) {
        console.error("❌ Erreur mise à jour statut propriété:", propertyUpdateError)
        // Ne pas faire échouer la requête pour cette erreur
      } else {
        console.log("✅ Propriété marquée comme louée")
      }
    }

    // Si la candidature est confirmée par le locataire, s'assurer que la propriété est bien marquée comme louée
    if (status === "confirmed" && isTenant) {
      console.log("✅ Candidature confirmée par le locataire")
      
      const { error: propertyUpdateError } = await supabase
        .from("properties")
        .update({
          status: "rented", // S'assurer que la propriété est marquée comme louée
          updated_at: new Date().toISOString()
        })
        .eq("id", application.property.id)

      if (propertyUpdateError) {
        console.error("❌ Erreur mise à jour statut propriété:", propertyUpdateError)
      } else {
        console.log("✅ Propriété confirmée comme louée")
      }
    }

    // Envoyer des emails de notification
    try {
      if (status === "accepted" && isOwner) {
        // Notifier le locataire que sa candidature a été acceptée
        await emailService.sendApplicationStatusUpdateEmail(
          { 
            id: application.tenant.id, 
            name: `${application.tenant.first_name} ${application.tenant.last_name}`, 
            email: application.tenant.email 
          },
          { 
            id: application.id, 
            status: "accepted" 
          },
          { 
            id: application.property.id, 
            title: application.property.title, 
            address: application.property.address 
          },
          "acceptée",
          notes || "",
          `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/applications`
        )
      } else if (status === "confirmed" && isTenant) {
        // Notifier le propriétaire que le locataire a confirmé
        await emailService.sendTenantConfirmedApplicationEmailToOwner(
          { 
            id: application.owner.id, 
            name: `${application.owner.first_name} ${application.owner.last_name}`, 
            email: application.owner.email 
          },
          { 
            id: application.tenant.id, 
            name: `${application.tenant.first_name} ${application.tenant.last_name}` 
          },
          { 
            id: application.property.id, 
            title: application.property.title, 
            address: application.property.address 
          },
          `${process.env.NEXT_PUBLIC_SITE_URL}/owner/applications`
        )
      }
    } catch (emailError) {
      console.warn("⚠️ Erreur envoi email notification:", emailError)
      // Ne pas faire échouer la requête pour un problème d'email
    }

    return NextResponse.json({ 
      success: true, 
      application: updatedApplication 
    })
  } catch (error) {
    console.error("❌ Erreur API mise à jour statut candidature:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
