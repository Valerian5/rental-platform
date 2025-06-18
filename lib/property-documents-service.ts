import { supabase } from "./supabase"
import { SupabaseStorageService } from "./supabase-storage-service"

export interface PropertyDocument {
  id: string
  property_id: string
  document_type: string
  document_name: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_at: string
  updated_at: string
}

export const REQUIRED_DOCUMENTS = {
  dpe: {
    name: "Diagnostic de Performance Énergétique (DPE)",
    description: "Document obligatoire indiquant la consommation énergétique du bien",
    required: true,
  },
  erp: {
    name: "État des Risques et Pollutions (ERP)",
    description: "Document obligatoire sur les risques naturels et technologiques",
    required: true,
  },
  electricity: {
    name: "Diagnostic électrique",
    description: "État de l'installation électrique si plus de 15 ans",
    required: false,
  },
  gas: {
    name: "Diagnostic gaz",
    description: "État de l'installation de gaz si plus de 15 ans",
    required: false,
  },
  lead: {
    name: "Diagnostic plomb",
    description: "Constat de risque d'exposition au plomb pour les logements construits avant 1949",
    required: false,
  },
  asbestos: {
    name: "Diagnostic amiante",
    description: "État de présence d'amiante pour les logements construits avant 1997",
    required: false,
  },
  termites: {
    name: "État parasitaire",
    description: "Présence de termites et autres insectes xylophages",
    required: false,
  },
  carrez: {
    name: "Loi Carrez",
    description: "Mesurage de la surface habitable pour les copropriétés",
    required: false,
  },
  insurance: {
    name: "Attestation d'assurance",
    description: "Assurance propriétaire non occupant",
    required: true,
  },
  copropriety: {
    name: "Documents de copropriété",
    description: "Règlement de copropriété, PV d'assemblée générale, etc.",
    required: false,
  },
  other: {
    name: "Autres documents",
    description: "Tout autre document relatif au bien",
    required: false,
  },
}

export const propertyDocumentsService = {
  async getPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
    try {
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("Erreur récupération documents:", error)
        throw new Error(error.message)
      }

      return data as PropertyDocument[]
    } catch (error) {
      console.error("Erreur getPropertyDocuments:", error)
      throw error
    }
  },

  async uploadDocument(propertyId: string, file: File, documentType: string): Promise<PropertyDocument> {
    try {
      // 1. Upload du fichier
      const result = await SupabaseStorageService.uploadFile(file, "property-documents", propertyId)

      // 2. Enregistrer les métadonnées
      const { data, error } = await supabase
        .from("property_documents")
        .insert({
          property_id: propertyId,
          document_type: documentType,
          document_name: file.name,
          file_url: result.url,
          file_size: file.size,
          file_type: file.type,
        })
        .select()
        .single()

      if (error) {
        console.error("Erreur enregistrement document:", error)
        throw new Error(error.message)
      }

      return data as PropertyDocument
    } catch (error) {
      console.error("Erreur uploadDocument:", error)
      throw error
    }
  },

  async updateDocument(documentId: string, file: File, documentType: string): Promise<PropertyDocument> {
    try {
      // 1. Récupérer le document existant
      const { data: existingDoc, error: fetchError } = await supabase
        .from("property_documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (fetchError) {
        console.error("Erreur récupération document:", fetchError)
        throw new Error(fetchError.message)
      }

      // 2. Upload du nouveau fichier
      const result = await SupabaseStorageService.uploadFile(file, "property-documents", existingDoc.property_id)

      // 3. Mettre à jour les métadonnées
      const { data, error } = await supabase
        .from("property_documents")
        .update({
          document_type: documentType,
          document_name: file.name,
          file_url: result.url,
          file_size: file.size,
          file_type: file.type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .select()
        .single()

      if (error) {
        console.error("Erreur mise à jour document:", error)
        throw new Error(error.message)
      }

      return data as PropertyDocument
    } catch (error) {
      console.error("Erreur updateDocument:", error)
      throw error
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // 1. Récupérer le document pour avoir l'URL du fichier
      const { data: document, error: fetchError } = await supabase
        .from("property_documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (fetchError) {
        console.error("Erreur récupération document:", fetchError)
        throw new Error(fetchError.message)
      }

      // 2. Supprimer le fichier du stockage
      try {
        await SupabaseStorageService.deleteFile(document.file_url)
      } catch (storageError) {
        console.warn("Erreur suppression fichier (continuant):", storageError)
        // On continue même si la suppression du fichier échoue
      }

      // 3. Supprimer l'entrée de la base de données
      const { error } = await supabase.from("property_documents").delete().eq("id", documentId)

      if (error) {
        console.error("Erreur suppression document:", error)
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("Erreur deleteDocument:", error)
      throw error
    }
  },
}
