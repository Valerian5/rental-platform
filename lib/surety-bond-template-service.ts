// /lib/surety-bond-template-service.ts

export type SuretyBondTemplate = {
  id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
}

const API_BASE_URL = "/api/admin/surety-bond-templates"

export const suretyBondTemplateService = {
  async getTemplates(): Promise<SuretyBondTemplate[]> {
    const response = await fetch(API_BASE_URL)
    if (!response.ok) {
      throw new Error("Failed to fetch surety bond templates")
    }
    return response.json()
  },

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

  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete surety bond template")
    }
  },
}
