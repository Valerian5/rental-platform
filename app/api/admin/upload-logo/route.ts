import { type NextRequest, NextResponse } from "next/server"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 POST /api/admin/upload-logo")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const logoType = formData.get("logoType") as string

    console.log("📋 Upload logo:", { fileName: file?.name, logoType, fileSize: file?.size })

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

    console.log("✅ Validation OK, upload vers Supabase...")

    // Upload vers Supabase Storage avec fallback sur plusieurs buckets
    const uploadResult = await SupabaseStorageService.uploadFile(file, "logos", "admin")
    console.log("✅ Upload Supabase terminé:", uploadResult)

    // Utiliser le client serveur pour les opérations admin
    const supabase = createServerClient()

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

    if (dbError) {
      console.error("❌ Erreur DB uploaded_files:", dbError)
      // Continuer même si l'enregistrement dans uploaded_files échoue
    } else {
      console.log("✅ Fichier enregistré en DB:", fileRecord)
    }

    // Vérifier si la table site_settings existe
    const { data: tableExists, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "site_settings")
      .single()

    if (tableError || !tableExists) {
      console.error("❌ Table site_settings n'existe pas:", tableError)
      return NextResponse.json(
        {
          success: false,
          error: "Table site_settings manquante. Exécutez le script de création.",
          details: "Veuillez exécuter scripts/create-site-settings-table.sql",
        },
        { status: 500 },
      )
    }

    // Récupérer les logos actuels
    const { data: currentLogos, error: getError } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "logos")
      .single()

    if (getError && getError.code !== "PGRST116") {
      console.error("❌ Erreur récupération logos:", getError)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur récupération paramètres",
          details: getError.message,
        },
        { status: 500 },
      )
    }

    // Mettre à jour les logos
    const logos = currentLogos?.setting_value || {}
    logos[logoType] = uploadResult.url

    const { error: updateError } = await supabase.from("site_settings").upsert({
      setting_key: "logos",
      setting_value: logos,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      console.error("❌ Erreur update settings:", updateError)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur mise à jour paramètres",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Paramètres mis à jour")

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        filename: uploadResult.path.split("/").pop(),
        logoType,
      },
    })
  } catch (error) {
    console.error("❌ Erreur upload logo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'upload",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
