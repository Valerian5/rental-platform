/**
 * Convertit une URL blob en URL d'API accessible
 */
export function convertBlobUrlToApiUrl(blobUrl: string): string {
  if (!blobUrl || !blobUrl.includes("blob:")) {
    return blobUrl
  }

  // Extraire l'ID du document depuis l'URL blob
  const urlParts = blobUrl.split("/")
  const documentId = urlParts[urlParts.length - 1]

  // Retourner l'URL de l'API
  return `/api/documents/${documentId}`
}

/**
 * Récupère un document via l'API et le convertit en base64
 */
export async function fetchDocumentAsBase64(blobUrl: string): Promise<string | null> {
  try {
    const apiUrl = convertBlobUrlToApiUrl(blobUrl)
    console.log("🔄 Conversion:", blobUrl, "→", apiUrl)

    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du document:", error)
    return null
  }
}

/**
 * Ouvre un document dans une nouvelle fenêtre
 */
export function openDocument(blobUrl: string) {
  const apiUrl = convertBlobUrlToApiUrl(blobUrl)
  window.open(apiUrl, "_blank")
}
