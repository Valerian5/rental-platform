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

    // Tester la connexion à Vercel Blob via API REST
    try {
      // Test simple : créer un fichier de test
      const testContent = "Test file for Vercel Blob Storage"
      const testBlob = new Blob([testContent], { type: "text/plain" })
      const testFormData = new FormData()
      testFormData.append("file", testBlob, "test.txt")

      const testResponse = await fetch(`https://blob.vercel-storage.com?filename=test-${Date.now()}.txt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${blobReadWriteToken}`,
        },
        body: testFormData,
      })

      if (testResponse.ok) {
        const testResult = await testResponse.json()
        return NextResponse.json({
          configured: true,
          test_file: testResult,
          message: "Vercel Blob Storage configuré et fonctionnel",
        })
      } else {
        const errorText = await testResponse.text()
        return NextResponse.json({
          configured: false,
          error: "Erreur de connexion à Vercel Blob",
          details: `HTTP ${testResponse.status}: ${errorText}`,
          suggestion: "Vérifiez que le token est correct",
        })
      }
    } catch (blobError) {
      console.error("❌ Erreur Vercel Blob:", blobError)

      return NextResponse.json({
        configured: false,
        error: "Erreur de connexion à Vercel Blob",
        details: blobError.message,
        suggestion: "Vérifiez la connexion réseau et le token",
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
    const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobReadWriteToken) {
      throw new Error("BLOB_READ_WRITE_TOKEN manquant")
    }

    const testContent = "Test file for Vercel Blob Storage"
    const testBlob = new Blob([testContent], { type: "text/plain" })
    const testFormData = new FormData()
    testFormData.append("file", testBlob, "test.txt")

    const result = await fetch(`https://blob.vercel-storage.com?filename=test-${Date.now()}.txt`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${blobReadWriteToken}`,
      },
      body: testFormData,
    })

    if (result.ok) {
      const data = await result.json()
      return NextResponse.json({
        success: true,
        test_file: data,
        message: "Test d'upload réussi",
      })
    } else {
      const errorText = await result.text()
      throw new Error(`HTTP ${result.status}: ${errorText}`)
    }
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
