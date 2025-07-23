import { supabase } from "./supabase"

export interface Agency {
  id: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AgencyRole {
  id: string
  agency_id: string
  name: string
  description?: string
  permissions: {
    manage_properties?: boolean
    manage_applications?: boolean
    manage_visits?: boolean
    manage_leases?: boolean
    manage_users?: boolean
    view_analytics?: boolean
    manage_settings?: boolean
  }
  is_default: boolean
  created_at: string
}

export interface AgencyUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  agency_id: string
  user_type: string
  is_active: boolean
  roles: AgencyRole[]
  created_at: string
}

export const agencyService = {
  // Gestion des agences
  async getAgencies(): Promise<Agency[]> {
    console.log("🏢 AgencyService.getAgencies")

    try {
      const { data, error } = await supabase.from("agencies").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération agences:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data?.length || 0} agences récupérées`)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getAgencies:", error)
      throw error
    }
  },

  async getAgencyById(id: string): Promise<Agency | null> {
    console.log("🏢 AgencyService.getAgencyById", id)

    try {
      const { data, error } = await supabase.from("agencies").select("*").eq("id", id).single()

      if (error) {
        console.error("❌ Erreur récupération agence:", error)
        throw new Error(error.message)
      }

      console.log("✅ Agence récupérée:", data?.name)
      return data
    } catch (error) {
      console.error("❌ Erreur dans getAgencyById:", error)
      throw error
    }
  },

  async createAgency(agencyData: Partial<Agency>): Promise<Agency> {
    console.log("🏢 AgencyService.createAgency", agencyData.name)

    try {
      const { data, error } = await supabase
        .from("agencies")
        .insert({
          ...agencyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création agence:", error)
        throw new Error(error.message)
      }

      console.log("✅ Agence créée:", data.name)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createAgency:", error)
      throw error
    }
  },

  async updateAgency(id: string, updates: Partial<Agency>): Promise<Agency> {
    console.log("🏢 AgencyService.updateAgency", id)

    try {
      const { data, error } = await supabase
        .from("agencies")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour agence:", error)
        throw new Error(error.message)
      }

      console.log("✅ Agence mise à jour:", data.name)
      return data
    } catch (error) {
      console.error("❌ Erreur dans updateAgency:", error)
      throw error
    }
  },

  // Gestion des rôles
  async getAgencyRoles(agencyId: string): Promise<AgencyRole[]> {
    console.log("👥 AgencyService.getAgencyRoles", agencyId)

    try {
      const { data, error } = await supabase
        .from("agency_roles")
        .select("*")
        .eq("agency_id", agencyId)
        .order("name", { ascending: true })

      if (error) {
        console.error("❌ Erreur récupération rôles:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data?.length || 0} rôles récupérés`)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getAgencyRoles:", error)
      throw error
    }
  },

  async createAgencyRole(roleData: Partial<AgencyRole>): Promise<AgencyRole> {
    console.log("👥 AgencyService.createAgencyRole", roleData.name)

    try {
      const { data, error } = await supabase
        .from("agency_roles")
        .insert({
          ...roleData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création rôle:", error)
        throw new Error(error.message)
      }

      console.log("✅ Rôle créé:", data.name)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createAgencyRole:", error)
      throw error
    }
  },

  // Gestion des utilisateurs
  async getAgencyUsers(agencyId: string): Promise<AgencyUser[]> {
    console.log("👤 AgencyService.getAgencyUsers", agencyId)

    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          user_agency_roles(
            agency_role_id,
            agency_roles(*)
          )
        `)
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération utilisateurs:", error)
        throw new Error(error.message)
      }

      // Transformer les données pour inclure les rôles
      const users = (data || []).map((user: any) => ({
        ...user,
        roles: user.user_agency_roles?.map((uar: any) => uar.agency_roles) || [],
      }))

      console.log(`✅ ${users.length} utilisateurs récupérés`)
      return users
    } catch (error) {
      console.error("❌ Erreur dans getAgencyUsers:", error)
      throw error
    }
  },

  async inviteAgencyUser(
    agencyId: string,
    userData: {
      email: string
      first_name: string
      last_name: string
      role_id: string
    },
  ): Promise<any> {
    console.log("📧 AgencyService.inviteAgencyUser", userData.email)

    try {
      // Créer l'utilisateur
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          agency_id: agencyId,
          user_type: "agency",
          is_active: false, // Sera activé lors de l'acceptation de l'invitation
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (userError) {
        console.error("❌ Erreur création utilisateur:", userError)
        throw new Error(userError.message)
      }

      // Assigner le rôle
      const { error: roleError } = await supabase.from("user_agency_roles").insert({
        user_id: user.id,
        agency_role_id: userData.role_id,
        created_at: new Date().toISOString(),
      })

      if (roleError) {
        console.error("❌ Erreur assignation rôle:", roleError)
        // Supprimer l'utilisateur créé en cas d'erreur
        await supabase.from("users").delete().eq("id", user.id)
        throw new Error(roleError.message)
      }

      console.log("✅ Utilisateur invité:", userData.email)
      return user
    } catch (error) {
      console.error("❌ Erreur dans inviteAgencyUser:", error)
      throw error
    }
  },

  // Statistiques agence
  async getAgencyStats(agencyId: string): Promise<{
    properties: number
    applications: number
    visits: number
    leases: number
    revenue: number
  }> {
    console.log("📊 AgencyService.getAgencyStats", agencyId)

    try {
      // Récupérer les statistiques en parallèle
      const [{ count: propertiesCount }, { count: applicationsCount }, { count: visitsCount }, { count: leasesCount }] =
        await Promise.all([
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("agency_id", agencyId),
          supabase.from("applications").select("*", { count: "exact", head: true }).eq("agency_id", agencyId),
          supabase.from("visits").select("*", { count: "exact", head: true }).eq("agency_id", agencyId),
          supabase.from("leases").select("*", { count: "exact", head: true }).eq("agency_id", agencyId),
        ])

      const stats = {
        properties: propertiesCount || 0,
        applications: applicationsCount || 0,
        visits: visitsCount || 0,
        leases: leasesCount || 0,
        revenue: 0, // À calculer selon la logique métier
      }

      console.log("✅ Statistiques récupérées:", stats)
      return stats
    } catch (error) {
      console.error("❌ Erreur dans getAgencyStats:", error)
      throw error
    }
  },

  // Vérification des permissions
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    console.log("🔐 AgencyService.checkUserPermission", userId, permission)

    try {
      const { data, error } = await supabase
        .from("user_agency_roles")
        .select(`
          agency_roles(permissions)
        `)
        .eq("user_id", userId)

      if (error) {
        console.error("❌ Erreur vérification permission:", error)
        return false
      }

      const hasPermission = data?.some((role: any) => role.agency_roles?.permissions?.[permission] === true)

      console.log(`✅ Permission ${permission}:`, hasPermission)
      return hasPermission || false
    } catch (error) {
      console.error("❌ Erreur dans checkUserPermission:", error)
      return false
    }
  },
}
