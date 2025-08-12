import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 API Upload Supabase - Début")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Configuration Supabase manquante")
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer les données du formulaire
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = (formData.get("bucket") as string) || "documents"
    const folder = (formData.get("folder") as string) || "general"

    if (!file) {
      console.error("❌ Aucun fichier fourni")
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    console.log("📁 Fichier reçu:", file.name, "Taille:", file.size, "Type:", file.type)

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${folder}/${timestamp}-${sanitizedName}`

    console.log("📝 Nom généré:", filename)

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(filename, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("❌ Erreur Supabase Storage:", error)
      return NextResponse.json({ error: `Erreur upload: ${error.message}` }, { status: 500 })
    }

    console.log("✅ Upload réussi:", data.path)

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    const publicUrl = urlData.publicUrl

    console.log("🔗 URL publique:", publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
      filename: filename,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur API upload:", error)
    return NextResponse.json({ error: `Erreur serveur: ${error.message}` }, { status: 500 })
  }
}

// Nouvelle route pour supprimer un fichier
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ API Delete Supabase - Début")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get("path")
    const bucket = searchParams.get("bucket") || "documents"

    if (!filePath) {
      return NextResponse.json({ error: "Chemin du fichier manquant" }, { status: 400 })
    }

    console.log("🗑️ Suppression fichier:", filePath, "du bucket:", bucket)

    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error("❌ Erreur suppression:", error)
      return NextResponse.json({ error: `Erreur suppression: ${error.message}` }, { status: 500 })
    }

    console.log("✅ Fichier supprimé avec succès")

    return NextResponse.json({
      success: true,
      message: "Fichier supprimé avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur API delete:", error)
    return NextResponse.json({ error: `Erreur serveur: ${error.message}` }, { status: 500 })
  }
}
