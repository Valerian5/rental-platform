/**
 * Convertit une URL blob en URL d'API accessible
 */
export function convertBlobUrlToApiUrl(blobUrl: string): string {
  if (!blobUrl || !blobUrl.includes("blob:")) {
    return blobUrl
  }

  // Encoder l'URL blob complète pour l'API
  const encodedUrl = encodeURIComponent(blobUrl)
  return `/api/documents/${encodedUrl}`
}

/**
 * Récupère un document via l'API et le convertit en base64
 */
export async function fetchDocumentAsBase64(blobUrl: string): Promise<string | null> {
  try {
    console.log("📄 Récupération document:", blobUrl)

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
  const apiUrl = convertBlobUrlToApiUrl(blobUrl)
  console.log("🔗 Ouverture document:", apiUrl)
  window.open(apiUrl, "_blank")
}

/**
 * Extrait le nom de fichier depuis une URL blob
 */
export function extractDocumentName(blobUrl: string): string {
  if (!blobUrl) return "Document"

  const parts = blobUrl.split("/")
  const id = parts[parts.length - 1]
  return id.substring(0, 8) + "..." // Afficher juste les premiers caractères
}

/**
 * Vérifie si un document existe
 */
export async function checkDocumentExists(blobUrl: string): Promise<boolean> {
  try {
    const apiUrl = convertBlobUrlToApiUrl(blobUrl)
    const response = await fetch(apiUrl, { method: "HEAD" })
    return response.ok
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
    return null
  }
}
