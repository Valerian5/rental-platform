/**
 * Convertit une URL blob en URL d'API accessible (si possible)
 */
export function convertBlobUrlToApiUrl(blobUrl: string): string {
  if (!blobUrl) {
    return blobUrl
  }

  // Si c'est déjà une URL blob, on ne peut pas la convertir côté serveur
  if (blobUrl.includes("blob:")) {
    console.log("⚠️ URL blob détectée - utilisation directe côté client")
    return blobUrl
  }

  // Pour les autres URLs, on peut utiliser l'API
  const encodedUrl = encodeURIComponent(blobUrl)
  return `/api/documents/${encodedUrl}`
}

/**
 * Récupère un document et le convertit en base64
 * Gère spécialement les URLs blob côté client
 */
export async function fetchDocumentAsBase64(blobUrl: string): Promise<string | null> {
  try {
    console.log("📄 Récupération document:", blobUrl)

    // Si c'est une URL blob, on doit la traiter côté client
    if (blobUrl.includes("blob:")) {
      console.log("🔵 Traitement URL blob côté client")

      try {
        // Récupération directe de l'URL blob
        const response = await fetch(blobUrl)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const blob = await response.blob()
        console.log("📦 Blob récupéré:", blob.type, blob.size, "bytes")

        // Convertir en base64
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result as string
            console.log("✅ Conversion base64 réussie")
            resolve(base64)
          }
          reader.onerror = (error) => {
            console.error("❌ Erreur conversion base64:", error)
            resolve(null)
          }
          reader.readAsDataURL(blob)
        })
      } catch (blobError) {
        console.error("❌ Erreur récupération blob:", blobError)
        return null
      }
    }

    // Pour les autres URLs, utiliser l'API
    const apiUrl = convertBlobUrlToApiUrl(blobUrl)
    console.log("🔗 URL API:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "image/*,application/pdf,*/*",
      },
    })

    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} - ${response.statusText}`)
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    const blob = await response.blob()
    console.log("📦 Blob récupéré:", blob.type, blob.size, "bytes")

    // Convertir en base64
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        console.log("✅ Conversion base64 réussie")
        resolve(base64)
      }
      reader.onerror = (error) => {
        console.error("❌ Erreur conversion base64:", error)
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("❌ Erreur récupération document:", error)
    return null
  }
}

/**
 * Ouvre un document dans une nouvelle fenêtre
 */
export function openDocument(blobUrl: string): void {
  if (blobUrl.includes("blob:")) {
    // Pour les URLs blob, ouvrir directement
    console.log("🔗 Ouverture URL blob:", blobUrl)
    window.open(blobUrl, "_blank")
  } else {
    // Pour les autres URLs, utiliser l'API
    const apiUrl = convertBlobUrlToApiUrl(blobUrl)
    console.log("🔗 Ouverture document via API:", apiUrl)
    window.open(apiUrl, "_blank")
  }
}

/**
 * Extrait le nom de fichier depuis une URL
 */
export function extractDocumentName(blobUrl: string): string {
  if (!blobUrl) return "Document"

  if (blobUrl.includes("blob:")) {
    // Pour les URLs blob, extraire l'ID
    const parts = blobUrl.split("/")
    const id = parts[parts.length - 1]
    return `Doc-${id.substring(0, 8)}`
  }

  // Pour les autres URLs, extraire le nom de fichier
  const parts = blobUrl.split("/")
  return parts[parts.length - 1] || "Document"
}

/**
 * Vérifie si un document existe
 */
export async function checkDocumentExists(blobUrl: string): Promise<boolean> {
  try {
    if (blobUrl.includes("blob:")) {
      // Pour les URLs blob, faire un HEAD request direct
      const response = await fetch(blobUrl, { method: "HEAD" })
      return response.ok
    } else {
      // Pour les autres URLs, utiliser l'API
      const apiUrl = convertBlobUrlToApiUrl(blobUrl)
      const response = await fetch(apiUrl, { method: "HEAD" })
      return response.ok
    }
  } catch (error) {
    console.error("❌ Erreur vérification document:", error)
    return false
  }
}

/**
 * Liste tous les documents disponibles (pour debug)
 */
export async function listAvailableDocuments(): Promise<any> {
  try {
    const response = await fetch("/api/documents/list")
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("❌ Erreur listage documents:", error)
    return {
      total_files: 0,
      documents_bucket: { count: 0, files: [], error: "Erreur de connexion" },
      rental_files_bucket: { count: 0, files: [], error: "Erreur de connexion" },
    }
  }
}
