import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Vérifier les variables d'environnement Vercel Blob
    const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN

    console.log("🔍 Vérification configuration Vercel Blob...")
    console.log("BLOB_READ_WRITE_TOKEN présent:", !!blobReadWriteToken)

    if (!blobReadWriteToken) {
      return NextResponse.json({
        configured: false,
        error: "BLOB_READ_WRITE_TOKEN manquant",
        instructions: [
          "1. Aller sur vercel.com/dashboard",
          "2. Sélectionner votre projet",
          "3. Aller dans Storage > Create Database",
          "4. Choisir 'Blob' et créer",
          "5. Copier le token dans les variables d'environnement",
        ],
        environment_variables_needed: ["BLOB_READ_WRITE_TOKEN"],
      })
    }

    // Tester la connexion à Vercel Blob
    try {
      // Import dynamique pour éviter les erreurs si le package n'est pas installé
      const { put, list } = await import("@vercel/blob")

      // Test simple : lister les fichiers existants
      const { blobs } = await list()

      return NextResponse.json({
        configured: true,
        blob_count: blobs.length,
        blobs: blobs.slice(0, 5), // Premiers 5 fichiers
        message: "Vercel Blob Storage configuré et fonctionnel",
      })
    } catch (blobError) {
      console.error("❌ Erreur Vercel Blob:", blobError)

      return NextResponse.json({
        configured: false,
        error: "Erreur de connexion à Vercel Blob",
        details: blobError.message,
        suggestion: "Vérifiez que @vercel/blob est installé et que le token est correct",
      })
    }
  } catch (error) {
    console.error("❌ Erreur configuration storage:", error)
    return NextResponse.json(
      {
        configured: false,
        error: "Erreur lors de la vérification",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // Tester l'upload d'un fichier de test
    const { put } = await import("@vercel/blob")

    const testContent = "Test file for Vercel Blob Storage"
    const testBlob = new Blob([testContent], { type: "text/plain" })

    const result = await put(`test-${Date.now()}.txt`, testBlob, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      test_file: result,
      message: "Test d'upload réussi",
    })
  } catch (error) {
    console.error("❌ Erreur test upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors du test d'upload",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
