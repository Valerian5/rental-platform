import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("file") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni" }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue
      }

      // Générer un nom unique pour le fichier
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `incidents/${fileName}`

      // Convertir le fichier en ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = new Uint8Array(arrayBuffer)

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage.from("documents").upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

      if (error) {
        console.error("Erreur upload Supabase:", error)
        continue
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} fichier(s) uploadé(s)`,
    })
  } catch (error) {
    console.error("Erreur API upload:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
