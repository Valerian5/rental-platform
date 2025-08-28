import { supabase } from "./supabase"
import { notificationsService } from "./notifications-service"
import { sendApplicationReceivedEmail, sendNewApplicationNotificationToOwner } from "./email-service"

export interface ApplicationData {
  property_id: string
  tenant_id: string
  message?: string
  income?: number
  profession?: string
  company?: string
  contract_type?: string
  has_guarantor?: boolean
  guarantor_name?: string
  guarantor_relationship?: string
  guarantor_profession?: string
  guarantor_income?: number
  move_in_date?: string
  duration_preference?: string
  presentation?: string
}

export const applicationService = {
  // Créer une nouvelle candidature
  async createApplication(applicationData: ApplicationData) {
    console.log("📝 ApplicationService.createApplication", applicationData)

    try {
      // Vérifier si une candidature existe déjà
      const { data: existing, error: checkError } = await supabase
        .from("applications")
        .select("id, status")
        .eq("property_id", applicationData.property_id)
        .eq("tenant_id", applicationData.tenant_id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("❌ Erreur vérification candidature existante:", checkError)
        throw new Error("Erreur lors de la vérification")
      }

      if (existing) {
        throw new Error("Vous avez déjà postulé pour ce bien")
      }

      const { data, error } = await supabase.from("applications").insert(applicationData).select().single()

      if (error) {
        console.error("❌ Erreur création candidature:", error)
        throw new Error(error.message)
      }

      console.log("✅ Candidature créée:", data)

      // 🔔 Notifications + Emails
      try {
        // Récupérer la propriété + propriétaire
        const { data: property } = await supabase
          .from("properties")
          .select("id, owner_id, title, address")
          .eq("id", applicationData.property_id)
          .single()

        if (property) {
          // Récupérer les infos du locataire
          const { data: tenant } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("id", applicationData.tenant_id)
            .single()

          // Récupérer les infos du propriétaire
          const { data: owner } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("id", property.owner_id)
            .single()

          if (tenant && owner) {
            const tenantName = `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() || "Un locataire"
            const propertyTitle = property.title || "votre bien"

            // ✅ Notification interne
            await notificationsService.createNotification(property.owner_id, {
              title: "Nouvelle candidature",
              content: `${tenantName} a postulé pour ${propertyTitle}`,
              type: "application",
              action_url: `/owner/applications?id=${data.id}`,
            })

            console.log("✅ Notification créée pour le propriétaire")

            // ✅ Email au locataire
            await sendApplicationReceivedEmail(
              { id: tenant.id, name: tenantName, email: tenant.email },
              { id: property.id, title: propertyTitle, address: property.address },
            )

            // ✅ Email au propriétaire
            await sendNewApplicationNotificationToOwner(
              { id: owner.id, name: `${owner.first_name || ""} ${owner.last_name || ""}`.trim(), email: owner.email },
              { id: tenant.id, name: tenantName, email: tenant.email },
              { id: property.id, title: propertyTitle, address: property.address },
            )

            console.log("✅ Emails envoyés au locataire et au propriétaire")
          }
        }
      } catch (notifError) {
        console.error("❌ Erreur création notification/email:", notifError)
        // On ne bloque pas le processus si la notification ou l’email échoue
      }

      return data
    } catch (error) {
      console.error("❌ Erreur dans createApplication:", error)
      throw error
    }
  },

  // Vérifier si une candidature existe déjà
  async checkExistingApplication(propertyId: string, tenantId: string) {
    console.log("🔍 ApplicationService.checkExistingApplication", { propertyId, tenantId })

    try {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status")
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantId)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("❌ Erreur vérification candidature:", error)
        throw new Error(error.message)
      }

      return data || null
    } catch (error) {
      console.error("❌ Erreur dans checkExistingApplication:", error)
      throw error
    }
  },

  // Supprimer une candidature
  async withdrawApplication(applicationId: string, tenantId: string) {
    console.log("🗑️ ApplicationService.withdrawApplication", { applicationId, tenantId })

    try {
      // Vérifier que la candidature appartient au locataire
      const { data: application, error: checkError } = await supabase
        .from("applications")
        .select("id, tenant_id, status, property_id")
        .eq("id", applicationId)
        .eq("tenant_id", tenantId)
        .single()

      if (checkError) {
        console.error("❌ Candidature non trouvée:", checkError)
        throw new Error("Candidature non trouvée")
      }

      // Vérifier que la candidature peut être supprimée
      if (application.status === "accepted") {
        throw new Error("Impossible de retirer une candidature acceptée")
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
        throw new Error(deleteError.message)
      }

      console.log("✅ Candidature supprimée")
      return true
    } catch (error) {
      console.error("❌ Erreur dans withdrawApplication:", error)
      throw error
    }
  },

  // Récupérer les candidatures d'un locataire
  async getTenantApplications(tenantId: string) {
    console.log("📋 ApplicationService.getTenantApplications", tenantId)

    try {
      // Récupérer les candidatures sans JOIN sur visits
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
        console.error("❌ Erreur récupération candidatures:", error)
        throw new Error(error.message)
      }

      // Récupérer les visites séparément pour chaque candidature
      const enrichedApplications = await Promise.all(
        (applications || []).map(async (app) => {
          try {
            const { data: visits } = await supabase
              .from("visits")
              .select("*")
              .eq("tenant_id", tenantId)
              .eq("property_id", app.property_id)

            return {
              ...app,
              visits: visits || [],
            }
          } catch (visitError) {
            console.error("❌ Erreur récupération visites:", visitError)
            return {
              ...app,
              visits: [],
            }
          }
        }),
      )

      console.log("✅ Candidatures récupérées:", enrichedApplications?.length || 0)
      return enrichedApplications || []
    } catch (error) {
      console.error("❌ Erreur dans getTenantApplications:", error)
      throw error
    }
  },

  // Récupérer les candidatures d'un propriétaire via les propriétés
  async getOwnerApplications(ownerId: string) {
    console.log("📋 ApplicationService.getOwnerApplications", ownerId)

    try {
      // D'abord récupérer les propriétés du propriétaire
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", ownerId)

      if (propError) {
        console.error("❌ Erreur récupération propriétés:", propError)
        throw new Error(propError.message)
      }

      if (!properties || properties.length === 0) {
        console.log("✅ Aucune propriété trouvée pour ce propriétaire")
        return []
      }

      const propertyIds = properties.map((p) => p.id)

      // Ensuite récupérer les candidatures pour ces propriétés
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
        throw new Error(error.message)
      }

      // Enrichir avec les visites
      const enrichedApplications = await Promise.all(
        (applications || []).map(async (app) => {
          const { data: visits } = await supabase
            .from("visits")
            .select("*")
            .eq("tenant_id", app.tenant_id)
            .eq("property_id", app.property_id)

          return {
            ...app,
            visits: visits || [],
          }
        }),
      )

      console.log("✅ Candidatures propriétaire récupérées:", enrichedApplications?.length || 0)
      return enrichedApplications || []
    } catch (error) {
      console.error("❌ Erreur dans getOwnerApplications:", error)
      throw error
    }
  },

  // Récupérer une candidature par ID
  async getApplicationById(applicationId: string) {
    console.log("🔍 ApplicationService.getApplicationById", applicationId)

    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(*),
          tenant:users(*)
        `)
        .eq("id", applicationId)
        .single()

      if (error) {
        console.error("❌ Erreur récupération candidature:", error)
        throw new Error(error.message)
      }

      // Récupérer les visites séparément
      const { data: visits } = await supabase
        .from("visits")
        .select("*")
        .eq("tenant_id", data.tenant_id)
        .eq("property_id", data.property_id)

      console.log("✅ Candidature récupérée:", data)
      return {
        ...data,
        visits: visits || [],
      }
    } catch (error) {
      console.error("❌ Erreur dans getApplicationById:", error)
      throw error
    }
  },

  // Mettre à jour le statut d'une candidature
  async updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    console.log("🔄 ApplicationService.updateApplicationStatus", applicationId, status)

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (notes) {
        updateData.notes = notes
      }

      const { data, error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour statut:", error)
        throw new Error(error.message)
      }

      console.log("✅ Statut mis à jour:", data)

      // Créer une notification pour le locataire
      try {
        // Récupérer les informations de la propriété
        const { data: application } = await supabase
          .from("applications")
          .select(`
            tenant_id,
            property:properties(title, owner_id)
          `)
          .eq("id", applicationId)
          .single()

        if (application && application.tenant_id) {
          const propertyTitle = application.property?.title || "un bien"
          let notificationTitle = ""
          let notificationContent = ""

          if (status === "accepted") {
            notificationTitle = "Candidature acceptée"
            notificationContent = `Votre candidature pour ${propertyTitle} a été acceptée !`
          } else if (status === "rejected") {
            notificationTitle = "Candidature refusée"
            notificationContent = `Votre candidature pour ${propertyTitle} n'a pas été retenue.`
          } else if (status === "visit_proposed") {
            notificationTitle = "Créneaux de visite proposés"
            notificationContent = `Des créneaux de visite ont été proposés pour ${propertyTitle}`
          }

          if (notificationTitle) {
            await notificationsService.createNotification(application.tenant_id, {
              title: notificationTitle,
              content: notificationContent,
              type: "application_status",
              action_url: `/tenant/applications`,
            })

            console.log("✅ Notification créée pour le locataire")
          }
        }
      } catch (notifError) {
        console.error("❌ Erreur création notification:", notifError)
        // On ne bloque pas le processus si la notification échoue
      }

      return data
    } catch (error) {
      console.error("❌ Erreur dans updateApplicationStatus:", error)
      throw error
    }
  },

  // Calculer le score de compatibilité
  calculateMatchScore(application: any, property: any): number {
    let score = 0
    const maxScore = 100

    // Ratio revenus/loyer (40 points max)
    if (application.income && property.price) {
      const rentRatio = application.income / property.price
      if (rentRatio >= 3) score += 40
      else if (rentRatio >= 2.5) score += 30
      else if (rentRatio >= 2) score += 20
      else score += 10
    } else {
      score += 10 // Score de base si pas d'info
    }

    // Stabilité professionnelle (20 points max)
    if (application.contract_type === "CDI") score += 20
    else if (application.contract_type === "CDD") score += 15
    else score += 10

    // Présence d'un garant (20 points max)
    if (application.has_guarantor) {
      score += 20
      // Bonus si le garant a des revenus suffisants
      if (application.guarantor_income && property.price && application.guarantor_income >= property.price * 3) {
        score += 5
      }
    }

    // Présentation personnalisée (15 points max)
    if (application.presentation && application.presentation.length > 50) {
      score += 15
    } else if (application.message && application.message.length > 20) {
      score += 10
    }

    // Bonus pour les informations complètes (5 points max)
    if (application.profession && application.company) {
      score += 5
    }

    return Math.min(score, maxScore)
  },
}