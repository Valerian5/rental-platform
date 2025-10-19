import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = (formData.getAll("file") as File[]).filter(Boolean)
    const bucket = (formData.get("bucket") as string) || "documents"
    const folder = (formData.get("folder") as string) || "general"

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Vérifier la taille (max 10MB par fichier)
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `Fichier trop volumineux (max 10MB): ${f.name}` }, { status: 400 })
      }
    }

    const uploaded: { url: string; path: string }[] = []

    for (const file of files) {
      // Générer un nom unique pour éviter les doublons
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.name.split(".").pop()
      const fileName = `${folder}/${timestamp}_${randomId}.${fileExtension}`

      console.log("📤 Upload vers Supabase:", fileName)

      // Upload vers Supabase
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false, // Important: ne pas écraser
      })

      if (error) {
        console.error("❌ Erreur Supabase:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

      console.log("✅ Upload réussi:", urlData.publicUrl)
      uploaded.push({ url: urlData.publicUrl, path: data.path })
    }

    return NextResponse.json({
      success: true,
      url: uploaded[0]?.url,
      path: uploaded[0]?.path,
      urls: uploaded.map((u) => u.url),
      files: uploaded,
    })
  } catch (error) {
    console.error("❌ Erreur upload:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")
    const bucket = searchParams.get("bucket") || "documents"

    if (!path) {
      return NextResponse.json({ error: "Chemin manquant" }, { status: 400 })
    }

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("❌ Erreur suppression:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur suppression:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
