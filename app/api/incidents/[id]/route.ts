import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { emailService } from "@/lib/email-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const server = createServerClient()
    const incidentId = params.id;

    // Récupérer l'incident avec ses relations
    const { data: incident, error } = await server
      .from("incidents")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code,
          property_type,
          surface
        ),
        lease:leases(
          id,
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          owner:users!leases_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq("id", incidentId)
      .single();

    if (error || !incident) {
      return NextResponse.json(
        { success: false, error: "Incident non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les réponses associées avec une requête simple et fiable
    console.log("🔍 [API GET INCIDENT] Récupération réponses pour incident:", incidentId)
    
    const { data: responses, error: responsesError } = await server
      .from("incident_responses")
      .select(`
        id,
        message,
        author_type,
        author_name,
        attachments,
        created_at,
        author_id
      `)
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true })

    console.log("📊 [API GET INCIDENT] Réponses brutes depuis Supabase:", {
      count: responses?.length || 0,
      ids: responses?.map(r => r.id) || [],
      messages: responses?.map(r => ({ 
        id: r.id, 
        message: r.message?.substring(0, 50), 
        created_at: r.created_at,
        author_type: r.author_type,
        author_name: r.author_name,
        author_id: r.author_id
      })) || []
    })
    
    // Log détaillé de chaque réponse
    if (responses && responses.length > 0) {
      console.log("🔍 [API GET INCIDENT] Détail de chaque réponse:")
      responses.forEach((r, index) => {
        console.log(`   ${index + 1}. ID: ${r.id}`)
        console.log(`      Message: ${r.message}`)
        console.log(`      Author Type: ${r.author_type}`)
        console.log(`      Author Name: ${r.author_name}`)
        console.log(`      Author ID: ${r.author_id}`)
        console.log(`      Created At: ${r.created_at}`)
        console.log(`      Attachments: ${r.attachments?.length || 0}`)
      })
    }

    if (responsesError) {
      console.error("❌ [API GET INCIDENT] Erreur récupération réponses:", responsesError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des réponses" },
        { status: 500 }
      );
    }

    // Vérification supplémentaire pour s'assurer que les réponses sont bien récupérées
    if (!responses || responses.length === 0) {
      console.log("⚠️ [API GET INCIDENT] Aucune réponse trouvée pour l'incident:", incidentId)
    } else {
      console.log("✅ [API GET INCIDENT] Réponses récupérées avec succès:", responses.length)
    }

    const mappedResponses = (responses || []).map((r: any) => ({
      id: r.id,
      message: r.message,
      user_type: r.author_type,
      user_id: r.author_id,
      user_name: r.author_name || "Utilisateur",
      created_at: r.created_at,
      attachments: r.attachments || [],
    }));
    
    console.log("✅ [API GET INCIDENT] Réponses mappées à envoyer au client:", mappedResponses.length, "réponses")
    
    // Log détaillé des réponses mappées
    if (mappedResponses.length > 0) {
      console.log("🔍 [API GET INCIDENT] Détail des réponses mappées:")
      mappedResponses.forEach((mr, index) => {
        console.log(`   ${index + 1}. ID: ${mr.id}`)
        console.log(`      Message: ${mr.message}`)
        console.log(`      User Type: ${mr.user_type}`)
        console.log(`      User Name: ${mr.user_name}`)
        console.log(`      User ID: ${mr.user_id}`)
        console.log(`      Created At: ${mr.created_at}`)
        console.log(`      Attachments: ${mr.attachments?.length || 0}`)
      })
    }

    return NextResponse.json(
      {
        success: true,
        incident: { ...incident, responses: mappedResponses },
        timestamp: new Date().toISOString(), // Ajouter timestamp pour éviter le cache
      },
      { 
        headers: { 
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        } 
      }
    );
  } catch (err) {
    console.error("Erreur API incident GET:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id;
    const body = await request.json();
    const { status, resolution_notes, cost } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (resolution_notes) updateData.resolution_notes = resolution_notes;
    if (cost !== undefined) updateData.cost = cost;
    if (status === "resolved") updateData.resolved_date = new Date().toISOString();

    const server = createServerClient()
    const { data, error } = await server
      .from("incidents")
      .update(updateData)
      .eq("id", incidentId)
      .select()
      .single();

    if (error) {
      console.error("Erreur mise à jour incident:", error);
      return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    // Notifications email si changement de statut
    if (status && ["resolved", "in_progress", "cancelled"].includes(status)) {
      try {
        const { data: incident } = await server
          .from("incidents")
          .select(`
            *,
            property:properties(*),
            lease:leases(
              tenant:users!leases_tenant_id_fkey(*),
              owner:users!leases_owner_id_fkey(*)
            )
          `)
          .eq("id", incidentId)
          .single();

        if (incident?.lease) {
          const statusMessages: Record<string, string> = {
            resolved: "résolu",
            in_progress: "en cours de traitement",
            cancelled: "annulé",
          };

          // Email locataire
          if (incident.lease.tenant) {
            await emailService.sendIncidentStatusUpdateEmail(
              { id: incident.lease.tenant.id, name: `${incident.lease.tenant.first_name} ${incident.lease.tenant.last_name}`, email: incident.lease.tenant.email },
              { id: incident.id, title: incident.title },
              { id: incident.property.id, title: incident.property.title },
              statusMessages[status] || status,
              resolution_notes || "",
              `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/incidents/${incidentId}`
            );
          }

          // Email propriétaire si résolu
          if (status === "resolved" && incident.lease.owner) {
            await emailService.sendIncidentResolvedOwnerEmail(
              { id: incident.lease.owner.id, name: `${incident.lease.owner.first_name} ${incident.lease.owner.last_name}`, email: incident.lease.owner.email },
              { id: incident.id, title: incident.title },
              { id: incident.property.id, title: incident.property.title },
              resolution_notes || "",
              cost || 0,
              `${process.env.NEXT_PUBLIC_SITE_URL}/owner/incidents/${incidentId}`
            );
          }
        }
      } catch (emailError) {
        console.error("Erreur envoi email statut incident:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      incident: data,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error("Erreur API incident PUT:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
