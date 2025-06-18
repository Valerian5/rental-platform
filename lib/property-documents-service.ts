import { supabase } from "./supabase"

export interface PropertyDocument {
  id: string
  property_id: string
  document_type: string
  document_name: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_at: string
  is_required: boolean
}

export const REQUIRED_DOCUMENTS = {
  "diagnostic-performance-energetique": {
    name: "Diagnostic de Performance Énergétique (DPE)",
    description: "Obligatoire pour toute location",
    required: true,
  },
  "diagnostic-gaz": {
    name: "Diagnostic Gaz",
    description: "Si installation gaz de plus de 15 ans",
    required: false,
  },
  "diagnostic-electricite": {
    name: "Diagnostic Électricité",
    description: "Si installation électrique de plus de 15 ans",
    required: false,
  },
  "diagnostic-plomb": {
    name: "Diagnostic Plomb (CREP)",
    description: "Pour les logements construits avant 1949",
    required: false,
  },
  "diagnostic-amiante": {
    name: "Diagnostic Amiante",
    description: "Pour les logements construits avant 1997",
    required: false,
  },
  "etat-risques-pollutions": {
    name: "État des Risques et Pollutions (ERP)",
    description: "Obligatoire selon la zone géographique",
    required: true,
  },
  "attestation-assurance": {
    name: "Attestation d'Assurance PNO",
    description: "Assurance Propriétaire Non Occupant",
    required: true,
  },
  "taxe-fonciere": {
    name: "Avis de Taxe Foncière",
    description: "Dernier avis de taxe foncière",
    required: false,
  },
  "reglement-copropriete": {
    name: "Règlement de Copropriété",
    description: "Si logement en copropriété",
    required: false,
  },
  autres: {
    name: "Autres Documents",
    description: "Documents complémentaires",
    required: false,
  },
}

export const propertyDocumentsService = {
  async uploadDocument(propertyId: string, file: File, documentType: string): Promise<PropertyDocument> {
    try {
      console.log("📄 Upload document:", { propertyId, documentType, fileName: file.name })

      // Upload du fichier vers Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${propertyId}/${documentType}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(fileName, file)

      if (uploadError) {
        console.error("❌ Erreur upload fichier:", uploadError)
        throw new Error(uploadError.message)
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from("property-documents").getPublicUrl(fileName)

      // Sauvegarder les métadonnées en base
      const { data, error } = await supabase
        .from("property_documents")
        .insert({
          property_id: propertyId,
          document_type: documentType,
          document_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          is_required: REQUIRED_DOCUMENTS[documentType as keyof typeof REQUIRED_DOCUMENTS]?.required || false,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur sauvegarde métadonnées:", error)
        throw new Error(error.message)
      }

      console.log("✅ Document uploadé:", data)
      return data as PropertyDocument
    } catch (error) {
      console.error("❌ Erreur uploadDocument:", error)
      throw error
    }
  },

  async getPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
    try {
      console.log("📄 Récupération documents propriété:", propertyId)

      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération documents:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data?.length || 0} documents récupérés`)
      return data as PropertyDocument[]
    } catch (error) {
      console.error("❌ Erreur getPropertyDocuments:", error)
      throw error
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log("🗑️ Suppression document:", documentId)

      // Récupérer les infos du document
      const { data: document, error: fetchError } = await supabase
        .from("property_documents")
        .select("file_url")
        .eq("id", documentId)
        .single()

      if (fetchError) {
        console.error("❌ Erreur récupération document:", fetchError)
        throw new Error(fetchError.message)
      }

      // Extraire le chemin du fichier depuis l'URL
      const url = new URL(document.file_url)
      const filePath = url.pathname.split("/").slice(-3).join("/") // Récupère propertyId/documentType/filename

      // Supprimer le fichier du storage
      const { error: deleteFileError } = await supabase.storage.from("property-documents").remove([filePath])

      if (deleteFileError) {
        console.warn("⚠️ Erreur suppression fichier storage:", deleteFileError)
        // On continue même si la suppression du fichier échoue
      }

      // Supprimer les métadonnées
      const { error: deleteMetaError } = await supabase.from("property_documents").delete().eq("id", documentId)

      if (deleteMetaError) {
        console.error("❌ Erreur suppression métadonnées:", deleteMetaError)
        throw new Error(deleteMetaError.message)
      }

      console.log("✅ Document supprimé")
    } catch (error) {
      console.error("❌ Erreur deleteDocument:", error)
      throw error
    }
  },

  async updateDocument(documentId: string, file: File, documentType: string): Promise<PropertyDocument> {
    try {
      console.log("🔄 Mise à jour document:", documentId)

      // Récupérer l'ancien document
      const { data: oldDocument, error: fetchError } = await supabase
        .from("property_documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      // Supprimer l'ancien fichier
      await this.deleteDocument(documentId)

      // Uploader le nouveau
      return await this.uploadDocument(oldDocument.property_id, file, documentType)
    } catch (error) {
      console.error("❌ Erreur updateDocument:", error)
      throw error
    }
  },

  getDocumentTypeInfo(documentType: string) {
    return (
      REQUIRED_DOCUMENTS[documentType as keyof typeof REQUIRED_DOCUMENTS] || {
        name: documentType,
        description: "",
        required: false,
      }
    )
  },
}
