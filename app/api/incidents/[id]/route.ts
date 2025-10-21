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

    // Récupérer les réponses associées DIRECTEMENT depuis Supabase avec cache-busting FORCÉ
    const timestamp = Date.now()
    console.log("🔍 [API GET INCIDENT] Récupération réponses pour incident:", incidentId, "à", new Date().toISOString(), "timestamp:", timestamp)
    
    // Forcer un refresh complet en recréant la connexion Supabase
    const freshServer = createServerClient()
    
    const { data: responses, error: responsesError } = await freshServer
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
      .abortSignal(AbortSignal.timeout(10000)) // Timeout pour forcer le refresh
      .neq("id", "00000000-0000-0000-0000-000000000000") // Force un scan complet de la table
      .gte("created_at", "1970-01-01"); // Force un scan complet de la table

    console.log("📊 [API GET INCIDENT] Réponses brutes depuis Supabase:", {
      count: responses?.length || 0,
      ids: responses?.map(r => r.id) || [],
      messages: responses?.map(r => ({ id: r.id, message: r.message?.substring(0, 50), created_at: r.created_at })) || []
    })

    if (responsesError) {
      console.error("❌ [API GET INCIDENT] Erreur récupération réponses:", responsesError);
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
