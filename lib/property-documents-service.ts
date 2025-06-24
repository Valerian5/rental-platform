import { SupabaseStorageService } from "./supabase-storage-service"
import { supabase } from "./supabase"

export const REQUIRED_DOCUMENTS = {
  dpe: {
    name: "Diagnostic de Performance Énergétique (DPE)",
    description: "Document obligatoire indiquant la performance énergétique du logement",
    required: true,
  },
  erp: {
    name: "État des Risques et Pollutions (ERP)",
    description: "Document d'information sur les risques naturels, miniers et technologiques",
    required: true,
  },
  insurance: {
    name: "Attestation d'assurance PNO",
    description: "Assurance Propriétaire Non Occupant obligatoire",
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
  lead: {
    name: "Diagnostic Plomb (CREP)",
    description: "Obligatoire pour les logements construits avant 1949",
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
  termites: {
    name: "État Parasitaire (Termites)",
    description: "Obligatoire dans certaines zones à risque",
    required: false,
  },
  energy_audit: {
    name: "Audit Énergétique",
    description: "Obligatoire pour les logements classés F ou G depuis 2023",
    required: false,
  },
  copropriety_docs: {
    name: "Documents de Copropriété",
    description: "Règlement de copropriété, PV d'AG, carnet d'entretien",
    required: false,
  },
  property_tax: {
    name: "Avis de Taxe Foncière",
    description: "Dernier avis de taxe foncière reçu",
    required: false,
  },
  other: {
    name: "Autres Documents",
    description: "Tout autre document relatif au bien",
    required: false,
  },
}

export interface PropertyDocument {
  id: string
  property_id: string
  document_type: string
  document_name: string
  file_url: string
  file_size: number
  uploaded_at: string
}

export const propertyDocumentsService = {
  async uploadDocument(propertyId: string, file: File, documentType: string): Promise<PropertyDocument> {
    console.log("📄 Upload document:", file.name, "type:", documentType, "pour propriété:", propertyId)

    try {
      // Upload vers Supabase Storage
      const result = await SupabaseStorageService.uploadFile(file, "property-documents", `properties/${propertyId}`)
      console.log("✅ Fichier uploadé vers:", result.url)

      // Sauvegarder les métadonnées en base
      const documentData = {
        property_id: propertyId,
        document_type: documentType,
        document_name: file.name,
        file_url: result.url,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      }

      console.log("💾 Sauvegarde métadonnées:", documentData)

      const { data, error } = await supabase.from("property_documents").insert(documentData).select().single()

      if (error) {
        console.error("❌ Erreur sauvegarde document:", error)
        throw new Error(`Erreur sauvegarde: ${error.message}`)
      }

      console.log("✅ Document sauvegardé avec ID:", data.id)
      return data
    } catch (error) {
      console.error("❌ Erreur uploadDocument:", error)
      throw error
    }
  },

  async getPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
    console.log("📋 Récupération documents pour propriété:", propertyId)

    try {
      // Vérifier d'abord si la table existe et sa structure
      const { data: tableInfo, error: tableError } = await supabase.from("property_documents").select("*").limit(1)

      if (tableError) {
        console.error("❌ Erreur accès table property_documents:", tableError)
        throw new Error(`Table non accessible: ${tableError.message}`)
      }

      console.log("✅ Table property_documents accessible")

      // Récupérer les documents
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération documents:", error)
        throw new Error(`Erreur récupération: ${error.message}`)
      }

      console.log("✅ Documents récupérés:", data?.length || 0)
      console.log("📄 Détails documents:", data)

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
        throw new Error(`Document non trouvé: ${fetchError.message}`)
      }

      console.log("📄 Document à supprimer:", document)

      // Supprimer de la base de données
      const { error: dbError } = await supabase.from("property_documents").delete().eq("id", documentId)

      if (dbError) {
        console.error("❌ Erreur suppression DB:", dbError)
        throw new Error(`Erreur suppression DB: ${dbError.message}`)
      }

      // Supprimer le fichier physique
      try {
        const url = new URL(document.file_url)
        const pathParts = url.pathname.split("/")
        if (pathParts.length >= 6) {
          const filePath = pathParts.slice(6).join("/")
          console.log("🗑️ Suppression fichier:", filePath)
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

  async updateDocument(documentId: string, newFile: File, newDocumentType: string): Promise<PropertyDocument> {
    console.log("🔄 Mise à jour document:", documentId)

    try {
      // Récupérer le document existant
      const { data: existingDoc, error: fetchError } = await supabase
        .from("property_documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (fetchError) {
        console.error("❌ Document non trouvé:", fetchError)
        throw new Error(`Document non trouvé: ${fetchError.message}`)
      }

      // Upload du nouveau fichier
      const result = await SupabaseStorageService.uploadFile(
        newFile,
        "property-documents",
        `properties/${existingDoc.property_id}`,
      )

      // Mettre à jour les métadonnées
      const { data, error } = await supabase
        .from("property_documents")
        .update({
          document_type: newDocumentType,
          document_name: newFile.name,
          file_url: result.url,
          file_size: newFile.size,
          uploaded_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour:", error)
        throw new Error(`Erreur mise à jour: ${error.message}`)
      }

      // Supprimer l'ancien fichier
      try {
        const oldUrl = new URL(existingDoc.file_url)
        const pathParts = oldUrl.pathname.split("/")
        if (pathParts.length >= 6) {
          const filePath = pathParts.slice(6).join("/")
          await SupabaseStorageService.deleteFile(filePath, "property-documents")
        }
      } catch (urlError) {
        console.warn("⚠️ Impossible de supprimer l'ancien fichier:", urlError)
      }

      console.log("✅ Document mis à jour")
      return data
    } catch (error) {
      console.error("❌ Erreur updateDocument:", error)
      throw error
    }
  },

  // Fonction de débogage pour vérifier la structure de la table
  async debugTableStructure(): Promise<void> {
    try {
      console.log("🔍 Vérification structure table property_documents")

      const { data, error } = await supabase.from("property_documents").select("*").limit(5)

      if (error) {
        console.error("❌ Erreur accès table:", error)
        return
      }

      console.log("✅ Exemples de données:", data)

      // Vérifier les colonnes
      if (data && data.length > 0) {
        console.log("📋 Colonnes disponibles:", Object.keys(data[0]))
      }
    } catch (error) {
      console.error("❌ Erreur debug:", error)
    }
  },
}
