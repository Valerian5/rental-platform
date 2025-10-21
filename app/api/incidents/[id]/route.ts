import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailService } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id;

    // Récupérer l'incident avec ses relations
    const { data: incident, error } = await supabase
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

    // Récupérer les réponses associées
    const { data: responses, error: responsesError } = await supabase
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
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error("Erreur récupération réponses:", responsesError);
    }

    const mappedResponses = (responses || []).map((r: any) => ({
      ...r,
      user_type: r.author_type,
      user_id: r.author_id,
      user_name: r.author_name || "Utilisateur",
    }));

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

    const { data, error } = await supabase
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
        const { data: incident } = await supabase
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
            await emailService.sendEmail({
              to: incident.lease.tenant.email,
              template: "incident_status_update",
              data: {
                tenantName: `${incident.lease.tenant.first_name} ${incident.lease.tenant.last_name}`,
                incidentTitle: incident.title,
                propertyTitle: incident.property.title,
                status: statusMessages[status] || status,
                resolutionNotes: resolution_notes || "",
                incidentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/incidents/${incidentId}`,
              },
            });
          }

          // Email propriétaire si résolu
          if (status === "resolved" && incident.lease.owner) {
            await emailService.sendEmail({
              to: incident.lease.owner.email,
              template: "incident_resolved_owner",
              data: {
                ownerName: `${incident.lease.owner.first_name} ${incident.lease.owner.last_name}`,
                incidentTitle: incident.title,
                propertyTitle: incident.property.title,
                resolutionNotes: resolution_notes || "",
                cost: cost || 0,
                incidentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/owner/incidents/${incidentId}`,
              },
            });
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
