import { supabase } from "./supabase"

export interface Lease {
  id: string
  property_id: string
  tenant_id: string
  owner_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  deposit: number
  lease_type: "unfurnished" | "furnished" | "commercial"
  status: "active" | "terminated" | "expired"
  signed_date: string
  lease_document_url?: string
  created_at: string
  updated_at: string
}

export interface RentReceipt {
  id: string
  lease_id: string
  month: string
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  payment_date?: string
  status: "pending" | "paid" | "overdue"
  receipt_url?: string
  created_at: string
}

export interface Incident {
  id: string
  lease_id: string
  property_id: string
  reported_by: string
  title: string
  description: string
  category: "plumbing" | "electrical" | "heating" | "security" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "reported" | "in_progress" | "resolved" | "closed"
  photos?: string[]
  resolution_notes?: string
  cost?: number
  resolved_date?: string
  created_at: string
}

export interface MaintenanceWork {
  id: string
  property_id: string
  lease_id?: string
  title: string
  description: string
  type: "preventive" | "corrective" | "improvement"
  category: "plumbing" | "electrical" | "heating" | "painting" | "other"
  scheduled_date: string
  completed_date?: string
  cost: number
  provider_name?: string
  provider_contact?: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  documents?: string[]
  created_at: string
}

export interface ChargeRegularization {
  id: string
  lease_id: string
  year: number
  total_charges_paid: number
  actual_charges: number
  difference: number
  type: "refund" | "additional_payment"
  status: "calculated" | "sent" | "paid"
  document_url?: string
  created_at: string
}

export interface RentRevision {
  id: string
  lease_id: string
  current_rent: number
  new_rent: number
  revision_date: string
  insee_index_reference: number
  insee_index_current: number
  revision_percentage: number
  status: "calculated" | "notified" | "applied"
  notification_date?: string
  document_url?: string
  created_at: string
}

export interface AnnualDocument {
  id: string
  lease_id: string
  tenant_id: string
  document_type: "insurance" | "boiler_maintenance" | "energy_certificate" | "other"
  document_name: string
  document_url: string
  expiry_date: string
  status: "valid" | "expiring" | "expired"
  reminder_sent: boolean
  created_at: string
}

export interface TaxReport {
  id: string
  owner_id: string
  year: number
  total_rental_income: number
  total_charges: number
  total_expenses: number
  taxable_income: number
  properties_data: any[]
  expenses_breakdown: any[]
  document_url?: string
  status: "draft" | "generated" | "submitted"
  created_at: string
}

export const rentalManagementService = {
  // === GESTION DES BAUX ===
  async createLease(leaseData: Partial<Lease>) {
    try {
      const { data, error } = await supabase.from("leases").insert(leaseData).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur création bail:", error)
      throw error
    }
  },

  async getActiveLease(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          *,
          tenant:users!tenant_id(id, first_name, last_name, email, phone),
          property:properties(id, title, address, city)
        `)
        .eq("property_id", propertyId)
        .eq("status", "active")
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data
    } catch (error) {
      console.error("Erreur récupération bail:", error)
      return null
    }
  },

  async getOwnerLeases(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          *,
          tenant:users!tenant_id(id, first_name, last_name, email, phone),
          property:properties(id, title, address, city)
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Erreur récupération baux propriétaire:", error)
      return []
    }
  },

  // === GESTION DES QUITTANCES ===
  async generateMonthlyReceipts() {
    try {
      const currentDate = new Date()
      const month = currentDate.toLocaleString("fr-FR", { month: "long" })
      const year = currentDate.getFullYear()

      // Récupérer tous les baux actifs
      const { data: activeLeases, error } = await supabase.from("leases").select("*").eq("status", "active")

      if (error) throw error

      const receipts = []
      for (const lease of activeLeases || []) {
        // Vérifier si la quittance n'existe pas déjà
        const { data: existingReceipt } = await supabase
          .from("rent_receipts")
          .select("id")
          .eq("lease_id", lease.id)
          .eq("month", month)
          .eq("year", year)
          .single()

        if (!existingReceipt) {
          const receiptData = {
            lease_id: lease.id,
            month,
            year,
            rent_amount: lease.monthly_rent,
            charges_amount: lease.charges,
            total_amount: lease.monthly_rent + lease.charges,
            status: "pending" as const,
          }

          const { data: newReceipt, error: receiptError } = await supabase
            .from("rent_receipts")
            .insert(receiptData)
            .select()
            .single()

          if (!receiptError) {
            receipts.push(newReceipt)
          }
        }
      }

      return receipts
    } catch (error) {
      console.error("Erreur génération quittances:", error)
      throw error
    }
  },

  async getLeaseReceipts(leaseId: string) {
    try {
      const { data, error } = await supabase
        .from("rent_receipts")
        .select("*")
        .eq("lease_id", leaseId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Erreur récupération quittances:", error)
      return []
    }
  },

  async markReceiptAsPaid(receiptId: string, paymentDate: string) {
    try {
      const { data, error } = await supabase
        .from("rent_receipts")
        .update({
          status: "paid",
          payment_date: paymentDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", receiptId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur mise à jour quittance:", error)
      throw error
    }
  },

  // === GESTION DES INCIDENTS ===
  async reportIncident(incidentData: Partial<Incident>) {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .insert({
          ...incidentData,
          status: "reported",
        })
        .select()
        .single()

      if (error) throw error

      // Notifier le propriétaire
      // TODO: Envoyer notification/email

      return data
    } catch (error) {
      console.error("Erreur signalement incident:", error)
      throw error
    }
  },

  async getPropertyIncidents(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select(`
          *,
          reporter:users!reported_by(first_name, last_name)
        `)
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Erreur récupération incidents:", error)
      return []
    }
  },

  async updateIncidentStatus(incidentId: string, status: string, resolutionNotes?: string, cost?: number) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (resolutionNotes) updateData.resolution_notes = resolutionNotes
      if (cost) updateData.cost = cost
      if (status === "resolved") updateData.resolved_date = new Date().toISOString()

      const { data, error } = await supabase.from("incidents").update(updateData).eq("id", incidentId).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur mise à jour incident:", error)
      throw error
    }
  },

  // === GESTION DES TRAVAUX ===
  async scheduleMaintenanceWork(workData: Partial<MaintenanceWork>) {
    try {
      const { data, error } = await supabase
        .from("maintenance_works")
        .insert({
          ...workData,
          status: "scheduled",
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur programmation travaux:", error)
      throw error
    }
  },

  async getPropertyMaintenanceWorks(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from("maintenance_works")
        .select("*")
        .eq("property_id", propertyId)
        .order("scheduled_date", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Erreur récupération travaux:", error)
      return []
    }
  },

  // === RÉVISION DE LOYER ===
  async calculateRentRevision(leaseId: string, newInseeIndex: number) {
    try {
      // Récupérer le bail
      const { data: lease, error: leaseError } = await supabase.from("leases").select("*").eq("id", leaseId).single()

      if (leaseError) throw leaseError

      // Récupérer la dernière révision ou l'indice de référence
      const { data: lastRevision } = await supabase
        .from("rent_revisions")
        .select("*")
        .eq("lease_id", leaseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const referenceIndex = lastRevision?.insee_index_current || 100 // Indice de base
      const revisionPercentage = ((newInseeIndex - referenceIndex) / referenceIndex) * 100
      const newRent = Math.round(lease.monthly_rent * (1 + revisionPercentage / 100))

      const revisionData = {
        lease_id: leaseId,
        current_rent: lease.monthly_rent,
        new_rent: newRent,
        revision_date: new Date().toISOString(),
        insee_index_reference: referenceIndex,
        insee_index_current: newInseeIndex,
        revision_percentage: revisionPercentage,
        status: "calculated" as const,
      }

      const { data, error } = await supabase.from("rent_revisions").insert(revisionData).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur calcul révision loyer:", error)
      throw error
    }
  },

  // === RÉGULARISATION DES CHARGES ===
  async calculateChargeRegularization(leaseId: string, actualCharges: number) {
    try {
      const currentYear = new Date().getFullYear() - 1 // Année précédente

      // Calculer le total des charges payées
      const { data: receipts, error } = await supabase
        .from("rent_receipts")
        .select("charges_amount")
        .eq("lease_id", leaseId)
        .eq("year", currentYear)

      if (error) throw error

      const totalChargesPaid = receipts?.reduce((sum, receipt) => sum + receipt.charges_amount, 0) || 0
      const difference = actualCharges - totalChargesPaid

      const regularizationData = {
        lease_id: leaseId,
        year: currentYear,
        total_charges_paid: totalChargesPaid,
        actual_charges: actualCharges,
        difference: Math.abs(difference),
        type: difference > 0 ? ("additional_payment" as const) : ("refund" as const),
        status: "calculated" as const,
      }

      const { data, error: regError } = await supabase
        .from("charge_regularizations")
        .insert(regularizationData)
        .select()
        .single()

      if (regError) throw regError
      return data
    } catch (error) {
      console.error("Erreur régularisation charges:", error)
      throw error
    }
  },

  // === DOCUMENTS ANNUELS ===
  async checkAnnualDocuments(leaseId: string) {
    try {
      const { data, error } = await supabase
        .from("annual_documents")
        .select("*")
        .eq("lease_id", leaseId)
        .order("expiry_date", { ascending: true })

      if (error) throw error

      // Vérifier les documents qui expirent bientôt
      const today = new Date()
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

      const expiringDocuments = data?.filter((doc) => {
        const expiryDate = new Date(doc.expiry_date)
        return expiryDate <= in30Days && doc.status !== "expired"
      })

      return {
        allDocuments: data || [],
        expiringDocuments: expiringDocuments || [],
      }
    } catch (error) {
      console.error("Erreur vérification documents:", error)
      return { allDocuments: [], expiringDocuments: [] }
    }
  },

  async addAnnualDocument(documentData: Partial<AnnualDocument>) {
    try {
      const { data, error } = await supabase.from("annual_documents").insert(documentData).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur ajout document annuel:", error)
      throw error
    }
  },

  // === BILAN FISCAL ===
  async generateTaxReport(ownerId: string, year: number) {
    try {
      // Récupérer tous les baux de l'année
      const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select(`
          *,
          property:properties(title, address, city),
          rent_receipts!inner(*)
        `)
        .eq("owner_id", ownerId)
        .eq("rent_receipts.year", year)

      if (leasesError) throw leasesError

      // Récupérer les travaux et frais
      const { data: maintenanceWorks, error: worksError } = await supabase
        .from("maintenance_works")
        .select("*")
        .eq("status", "completed")
        .gte("completed_date", `${year}-01-01`)
        .lte("completed_date", `${year}-12-31`)

      if (worksError) throw worksError

      // Calculer les revenus
      let totalRentalIncome = 0
      let totalCharges = 0
      const propertiesData: any[] = []

      leases?.forEach((lease) => {
        const propertyIncome = lease.rent_receipts?.reduce((sum: number, receipt: any) => sum + receipt.rent_amount, 0)
        const propertyCharges = lease.rent_receipts?.reduce(
          (sum: number, receipt: any) => sum + receipt.charges_amount,
          0,
        )

        totalRentalIncome += propertyIncome || 0
        totalCharges += propertyCharges || 0

        propertiesData.push({
          property: lease.property,
          income: propertyIncome,
          charges: propertyCharges,
        })
      })

      // Calculer les dépenses
      const totalExpenses = maintenanceWorks?.reduce((sum, work) => sum + (work.cost || 0), 0) || 0

      const expensesBreakdown = [
        {
          category: "Travaux et réparations",
          amount: totalExpenses,
          details: maintenanceWorks,
        },
      ]

      const taxableIncome = totalRentalIncome - totalExpenses

      const reportData = {
        owner_id: ownerId,
        year,
        total_rental_income: totalRentalIncome,
        total_charges: totalCharges,
        total_expenses: totalExpenses,
        taxable_income: taxableIncome,
        properties_data: propertiesData,
        expenses_breakdown: expensesBreakdown,
        status: "generated" as const,
      }

      const { data, error } = await supabase.from("tax_reports").insert(reportData).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Erreur génération bilan fiscal:", error)
      throw error
    }
  },

  async getOwnerTaxReports(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from("tax_reports")
        .select("*")
        .eq("owner_id", ownerId)
        .order("year", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Erreur récupération bilans fiscaux:", error)
      return []
    }
  },
}
