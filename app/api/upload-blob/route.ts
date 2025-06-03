import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 API Upload Blob - Début")

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error("❌ BLOB_READ_WRITE_TOKEN manquant")
      return NextResponse.json({ error: "Configuration Blob Storage manquante" }, { status: 500 })
    }

    // Récupérer les données du formulaire
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "documents"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    console.log("📁 Fichier reçu:", file.name, "Taille:", file.size)

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    console.log("📝 Nom généré:", filename)

    // Préparer l'upload vers Vercel Blob
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    // Upload vers Vercel Blob
    const blobResponse = await fetch(`https://blob.vercel-storage.com?filename=${encodeURIComponent(filename)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: uploadFormData,
    })

    if (!blobResponse.ok) {
      const errorText = await blobResponse.text()
      console.error("❌ Erreur Vercel Blob:", blobResponse.status, errorText)
      return NextResponse.json({ error: `Erreur upload: ${errorText}` }, { status: blobResponse.status })
    }

    const blobResult = await blobResponse.json()
    console.log("✅ Upload réussi:", blobResult.url)

    return NextResponse.json({
      success: true,
      url: blobResult.url,
      pathname: blobResult.pathname || filename,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur API upload:", error)
    return NextResponse.json({ error: `Erreur serveur: ${error.message}` }, { status: 500 })
  }
}
