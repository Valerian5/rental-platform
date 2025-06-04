import { type NextRequest, NextResponse } from "next/server"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const logoType = formData.get("logoType") as string

    if (!file || !logoType) {
      return NextResponse.json({ success: false, error: "Fichier ou type manquant" }, { status: 400 })
    }

    // Valider le type de fichier
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Type de fichier non autorisé" }, { status: 400 })
    }

    // Valider la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Fichier trop volumineux (max 5MB)" }, { status: 400 })
    }

    // Upload vers Supabase Storage
    const uploadResult = await SupabaseStorageService.uploadFile(file, "logos", "admin")

    // Enregistrer dans la base de données
    const { data: fileRecord, error: dbError } = await supabase
      .from("uploaded_files")
      .insert({
        filename: uploadResult.path.split("/").pop(),
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_url: uploadResult.url,
        category: `logo_${logoType}`,
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Mettre à jour les paramètres du site
    const { data: currentLogos } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "logos")
      .single()

    const logos = currentLogos?.setting_value || {}
    logos[logoType] = uploadResult.url

    const { error: updateError } = await supabase.from("site_settings").upsert({
      setting_key: "logos",
      setting_value: logos,
      updated_at: new Date().toISOString(),
    })

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        filename: fileRecord.filename,
        logoType,
      },
    })
  } catch (error) {
    console.error("Erreur upload logo:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
