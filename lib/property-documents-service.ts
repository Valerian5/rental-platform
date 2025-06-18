import { SupabaseStorageService } from "./supabase-storage-service"
import { supabase } from "./supabase"

export const REQUIRED_DOCUMENTS = {
  dpe: {
    name: "Diagnostic de Performance Énergétique (DPE)",
    description: "Document obligatoire indiquant la performance énergétique du logement",
    required: true,
  },
  lead_risk: {
    name: "État des Risques et Pollutions (ERP)",
    description: "Document d'information sur les risques naturels, miniers et technologiques",
    required: true,
  },
  surface_law: {
    name: "Attestation de superficie (Loi Carrez)",
    description: "Attestation de la superficie privative pour les copropriétés",
    required: false,
  },
  asbestos: {
    name: "Diagnostic Amiante",
    description: "Obligatoire pour les biens construits avant 1997",
    required: false,
  },
  gas_safety: {
    name: "Diagnostic Gaz",
    description: "Obligatoire si installation gaz de plus de 15 ans",
    required: false,
  },
  electrical_safety: {
    name: "Diagnostic Électricité",
    description: "Obligatoire si installation électrique de plus de 15 ans",
    required: false,
  },
}

export interface PropertyDocument {
  id: string
  property_id: string
  document_type: string
  document_name: string
  document_url: string
  uploaded_at: string
}

export const propertyDocumentsService = {
  async uploadDocument(propertyId: string, file: File, documentType: string): Promise<PropertyDocument> {
    console.log("📄 Upload document:", file.name, "type:", documentType)

    try {
      // Upload vers Supabase Storage
      const result = await SupabaseStorageService.uploadFile(file, "property-documents", `properties/${propertyId}`)

      // Sauvegarder les métadonnées en base
      const { data, error } = await supabase
        .from("property_documents")
        .insert({
          property_id: propertyId,
          document_type: documentType,
          document_name: file.name,
          document_url: result.url,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur sauvegarde document:", error)
        throw error
      }

      console.log("✅ Document uploadé:", data.id)
      return data
    } catch (error) {
      console.error("❌ Erreur uploadDocument:", error)
      throw error
    }
  },

  async getPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
    console.log("📋 Récupération documents propriété:", propertyId)

    try {
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération documents:", error)
        throw error
      }

      console.log("✅ Documents récupérés:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getPropertyDocuments:", error)
      throw error
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    console.log("🗑️ Suppression document:", documentId)

    try {
      // Récupérer les infos du document
      const { data: document, error: fetchError } = await supabase
        .from("property_documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (fetchError) {
        console.error("❌ Erreur récupération document:", fetchError)
        throw fetchError
      }

      // Supprimer de la base de données
      const { error: dbError } = await supabase.from("property_documents").delete().eq("id", documentId)

      if (dbError) {
        console.error("❌ Erreur suppression DB:", dbError)
        throw dbError
      }

      // Supprimer le fichier physique
      try {
        const url = new URL(document.document_url)
        const pathParts = url.pathname.split("/")
        if (pathParts.length >= 6) {
          const filePath = pathParts.slice(6).join("/")
          await SupabaseStorageService.deleteFile(filePath, "property-documents")
        }
      } catch (urlError) {
        console.warn("⚠️ Impossible de supprimer le fichier physique:", urlError)
      }

      console.log("✅ Document supprimé")
    } catch (error) {
      console.error("❌ Erreur dans deleteDocument:", error)
      throw error
    }
  },
}
