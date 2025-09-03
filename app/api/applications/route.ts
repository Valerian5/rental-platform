import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createServerClient } from "@/lib/supabase"
import { sendNewApplicationNotificationToOwner } from "@/lib/email-service"

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const tenantId = searchParams.get("tenant_id")
		const ownerId = searchParams.get("owner_id")

		console.log("📋 API Applications GET", { tenantId, ownerId })

		if (tenantId) {
			// Récupérer les candidatures pour un locataire
			const { data: applications, error } = await supabase
				.from("applications")
				.select(`
          *,
          property:properties(
            id,
            title,
            address,
            city,
            price,
            property_images(id, url, is_primary)
          )
        `)
				.eq("tenant_id", tenantId)
				.order("created_at", { ascending: false })

			if (error) {
				console.error("❌ Erreur récupération candidatures locataire:", error)
				return NextResponse.json({ error: error.message }, { status: 500 })
			}

			// Récupérer les visites séparément pour chaque candidature
			const enrichedApplications = await Promise.all(
				(applications || []).map(async (app) => {
					try {
						// Récupérer les visites pour cette candidature
						const { data: visits } = await supabase
							.from("visits")
							.select("*")
							.eq("tenant_id", tenantId)
							.eq("property_id", app.property_id)
							.order("visit_date", { ascending: true })

						// Récupérer les créneaux proposés si ils existent
						let proposedSlots: any[] = []
						if (app.proposed_slot_ids && Array.isArray(app.proposed_slot_ids) && app.proposed_slot_ids.length > 0) {
							const { data: slots } = await supabase
								.from("property_visit_slots")
								.select("*")
								.in("id", app.proposed_slot_ids)
								.order("date", { ascending: true })

							proposedSlots = slots || []
						}

						return {
							...app,
							visits: visits || [],
							proposed_visit_slots: proposedSlots,
						}
					} catch (enrichError) {
						console.error("❌ Erreur enrichissement candidature:", enrichError)
						return {
							...app,
							visits: [],
							proposed_visit_slots: [],
						}
					}
				}),
			)

			console.log(`✅ ${enrichedApplications.length} candidatures enrichies pour le locataire`)
			return NextResponse.json({ applications: enrichedApplications })
		}

		if (ownerId) {
			// Récupérer les candidatures pour un propriétaire
			const { data: properties, error: propError } = await supabase.from("properties").select("id").eq("owner_id", ownerId)

			if (propError) {
				console.error("❌ Erreur récupération propriétés:", propError)
				return NextResponse.json({ error: propError.message }, { status: 500 })
			}

			if (!properties || properties.length === 0) {
				return NextResponse.json({ applications: [] })
			}

			const propertyIds = properties.map((p) => p.id)

			const { data: applications, error } = await supabase
				.from("applications")
				.select(`
          *,
          property:properties(*),
          tenant:users(*)
        `)
				.in("property_id", propertyIds)
				.order("created_at", { ascending: false })

			if (error) {
				console.error("❌ Erreur récupération candidatures propriétaire:", error)
				return NextResponse.json({ error: error.message }, { status: 500 })
			}

			// Enrichir avec les visites et dossiers de location pour chaque candidature
			const enrichedApplications = await Promise.all(
				(applications || []).map(async (app) => {
					try {
						// Récupérer les visites
						const { data: visits } = await supabase
							.from("visits")
							.select("*")
							.eq("tenant_id", app.tenant_id)
							.eq("property_id", app.property_id)

						// Récupérer le dossier de location
						const { data: rentalFile } = await supabase
							.from("rental_files")
							.select("*")
							.eq("tenant_id", app.tenant_id)
							.single()

						return {
							...app,
							visits: visits || [],
							rental_file: rentalFile || null,
						}
					} catch (enrichError) {
						console.error("❌ Erreur enrichissement candidature:", enrichError)
						return {
							...app,
							visits: [],
							rental_file: null,
						}
					}
				}),
			)

			console.log(`✅ ${enrichedApplications.length} candidatures récupérées pour le propriétaire`)
			return NextResponse.json({ applications: enrichedApplications })
		}

		return NextResponse.json({ error: "tenant_id ou owner_id requis" }, { status: 400 })
	} catch (error) {
		console.error("❌ Erreur API applications:", error)
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		console.log("📋 API Applications POST", body)

		// Vérifier si une candidature existe déjà
		if (body.property_id && body.tenant_id) {
			const { data: existing, error: checkError } = await supabase
				.from("applications")
				.select("id")
				.eq("property_id", body.property_id)
				.eq("tenant_id", body.tenant_id)
				.single()

			if (checkError && checkError.code !== "PGRST116") {
				// PGRST116 = no rows found
				console.error("❌ Erreur vérification candidature existante:", checkError)
				return NextResponse.json({ error: "Erreur lors de la vérification" }, { status: 500 })
			}

			if (existing) {
				return NextResponse.json({ error: "Vous avez déjà postulé pour ce bien" }, { status: 400 })
			}
		}

		const { data, error } = await supabase.from("applications").insert(body).select().single()

		if (error) {
			console.error("❌ Erreur création candidature:", error)
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		// --- ENVOI EMAIL AU PROPRIÉTAIRE (via Service Role pour contourner RLS en lecture) ---
		if (data) {
			const server = createServerClient()

			// Récupérer le propriétaire et le locataire AVEC LE CLIENT SERVICE
			const { data: property } = await server
				.from("properties")
				.select("id, title, address, owner_id")
				.eq("id", data.property_id)
				.single()

			const { data: owner } = property?.owner_id
				? await server.from("users").select("id, email, first_name, last_name").eq("id", property.owner_id).single()
				: { data: null }

			const { data: tenant } = data.tenant_id
				? await server.from("users").select("id, email, first_name, last_name").eq("id", data.tenant_id).single()
				: { data: null }

			console.log("📧 Données email propriétaire:", {
				hasOwner: !!owner,
				ownerEmail: owner?.email,
				hasTenant: !!tenant,
				tenantEmail: tenant?.email,
				propertyTitle: property?.title,
			})

			if (owner?.email && tenant && property) {
				try {
					await sendNewApplicationNotificationToOwner(
						{
							id: owner.id,
							name: `${owner.first_name} ${owner.last_name}`,
							email: owner.email,
						},
						{
							id: tenant.id,
							name: `${tenant.first_name} ${tenant.last_name}`,
							email: tenant.email,
						},
						{
							id: property.id,
							title: property.title,
							address: property.address,
						},
					)
					console.log("✅ Email nouvelle candidature envoyé au propriétaire:", owner.email)
				} catch (e) {
					console.error("❌ Erreur envoi email nouvelle candidature au propriétaire:", e)
				}
			} else {
				console.warn("⚠️ Email non envoyé: informations incomplètes (owner/tenant/property)")
			}
		}
		// --- FIN ENVOI EMAIL ---

		return NextResponse.json({ application: data })
	} catch (error) {
		console.error("❌ Erreur API applications POST:", error)
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const applicationId = searchParams.get("id")
		const tenantId = searchParams.get("tenant_id")

		if (!applicationId || !tenantId) {
			return NextResponse.json({ error: "ID candidature et tenant_id requis" }, { status: 400 })
		}

		console.log("🗑️ Suppression candidature:", { applicationId, tenantId })

		// Vérifier que la candidature appartient au locataire
		const { data: application, error: checkError } = await supabase
			.from("applications")
			.select("id, tenant_id, status, property_id")
			.eq("id", applicationId)
			.eq("tenant_id", tenantId)
			.single()

		if (checkError) {
			console.error("❌ Candidature non trouvée:", checkError)
			return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
		}

		// Vérifier que la candidature peut être supprimée
		if (application.status === "accepted") {
			return NextResponse.json({ error: "Impossible de retirer une candidature acceptée" }, { status: 400 })
		}

		// Supprimer les visites associées si elles existent
		const { error: visitError } = await supabase
			.from("visits")
			.delete()
			.eq("tenant_id", tenantId)
			.eq("property_id", application.property_id)
			.in("status", ["scheduled", "proposed"])

		if (visitError) {
			console.error("❌ Erreur suppression visites:", visitError)
			// On continue même si la suppression des visites échoue
		}

		// Supprimer la candidature
		const { error: deleteError } = await supabase
			.from("applications")
			.delete()
			.eq("id", applicationId)
			.eq("tenant_id", tenantId)

		if (deleteError) {
			console.error("❌ Erreur suppression candidature:", deleteError)
			return NextResponse.json({ error: deleteError.message }, { status: 500 })
		}

		console.log("✅ Candidature supprimée")
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("❌ Erreur API applications DELETE:", error)
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json()
		const { id, status, notes } = body as { id: string; status?: string; notes?: string }

		if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

		// Récupérer la candidature + tenant + property + owner (avec client normal)
		const { data: app, error: appErr } = await supabase
			.from("applications")
			.select("*, tenant:users!applications_tenant_id_fkey(*), property:properties(*, owner:users(*))")
			.eq("id", id)
			.single()

		if (appErr || !app) {
			console.error("❌ Application introuvable:", appErr)
			return NextResponse.json({ error: "Application introuvable" }, { status: 404 })
		}

		let update: any = { updated_at: new Date().toISOString() }
		let sendTenantWaitingEmail = false

		// Cas demandé: le proprio “accepte” → on bascule en attente confirmation locataire
		if (status === "accepted") {
			update.status = "waiting_tenant_confirmation"
			update.tenant_confirmation_status = "pending"
			update.tenant_refusal_reason = null
			update.tenant_confirmed_at = null
			if (notes) update.notes = notes
			sendTenantWaitingEmail = true
		} else if (status) {
			// Autres updates de statut classiques
			update.status = status
			if (notes) update.notes = notes
		} else if (notes) {
			update.notes = notes
		}

		const { data: updated, error: updErr } = await supabase
			.from("applications")
			.update(update)
			.eq("id", id)
			.select()
			.single()

		if (updErr) {
			console.error("❌ Erreur update application:", updErr)
			return NextResponse.json({ error: updErr.message }, { status: 400 })
		}

		// Email au locataire pour lui demander de confirmer
		if (sendTenantWaitingEmail && app.tenant?.email && app.property) {
			try {
				const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/applications`
				await sendWaitingTenantConfirmationEmailToTenant(
					{ id: app.tenant.id, name: `${app.tenant.first_name} ${app.tenant.last_name}`, email: app.tenant.email },
					{ id: app.property.id, title: app.property.title, address: app.property.address },
					confirmUrl,
					app.property.owner ? `${app.property.owner.first_name} ${app.property.owner.last_name}` : undefined,
				)
			} catch (e) {
				console.error("❌ Erreur envoi email attente confirmation locataire:", e)
			}
		}

		return NextResponse.json({ application: updated })
	} catch (error) {
		console.error("❌ Erreur API applications PATCH:", error)
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
	}
}