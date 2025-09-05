// /lib/surety-bond-template-service.ts

/**
 * Définit la structure d'un modèle d'acte de cautionnement.
 */
export type SuretyBondTemplate = {
  id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
  bond_type: "simple" | "solidary"
  duration_type: "determined" | "undetermined"
}

const API_BASE_URL = "/api/admin/surety-bond-templates"

/**
 * Service pour gérer les opérations CRUD pour les modèles d'acte de cautionnement.
 */
export const suretyBondTemplateService = {
  /**
   * Récupère tous les modèles d'acte de cautionnement.
   */
  async getTemplates(): Promise<SuretyBondTemplate[]> {
    const response = await fetch(API_BASE_URL)
    if (!response.ok) {
      throw new Error("Failed to fetch surety bond templates")
    }
    return response.json()
  },

  /**
   * Crée un nouveau modèle d'acte de cautionnement.
   * @param template - Les données du modèle à créer.
   */
  async createTemplate(
    template: Partial<SuretyBondTemplate>,
  ): Promise<SuretyBondTemplate> {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    })
    if (!response.ok) {
      throw new Error("Failed to create surety bond template")
    }
    return response.json()
  },

  /**
   * Met à jour un modèle d'acte de cautionnement existant.
   * @param id - L'ID du modèle à mettre à jour.
   * @param template - Les données à mettre à jour.
   */
  async updateTemplate(
    id: string,
    template: Partial<SuretyBondTemplate>,
  ): Promise<SuretyBondTemplate> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    })
    if (!response.ok) {
      throw new Error("Failed to update surety bond template")
    }
    return response.json()
  },

  /**
   * Supprime un modèle d'acte de cautionnement.
   * @param id - L'ID du modèle à supprimer.
   */
  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete surety bond template")
    }
  },
}

