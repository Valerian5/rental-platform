import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string
    const monthKey = formData.get("monthKey") as string

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Générer un nom de fichier temporaire unique
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2)
    const fileExtension = file.name.split(".").pop()
    const tempFileName = `temp/${documentType}_${monthKey || "single"}_${timestamp}_${randomId}.${fileExtension}`

    // Upload temporaire (sera supprimé après 1h)
    const { data, error } = await supabase.storage.from("documents").upload(tempFileName, file, {
      cacheControl: "3600", // 1 heure
      upsert: false,
    })

    if (error) {
      console.error("Erreur upload temporaire:", error)
      return NextResponse.json({ error: "Erreur lors du pré-upload" }, { status: 500 })
    }

    // Générer URL de preview
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      previewUrl: urlData.publicUrl,
      tempPath: data.path,
    })
  } catch (error) {
    console.error("Erreur pré-upload:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
