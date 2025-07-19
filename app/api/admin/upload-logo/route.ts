import { type NextRequest, NextResponse } from "next/server"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 POST /api/admin/upload-logo")

    // Vérifier l'authentification admin
    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("❌ Pas d'utilisateur authentifié")
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      console.log("❌ Utilisateur non admin tente d'uploader un logo")
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

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

    // Upload vers Supabase Storage
    let uploadResult
    try {
      uploadResult = await SupabaseStorageService.uploadFile(file, "logos", "admin")
      console.log("✅ Upload vers logos réussi:", uploadResult)
    } catch (logoError) {
      console.log("⚠️ Échec upload vers logos, tentative vers documents...")
      try {
        uploadResult = await SupabaseStorageService.uploadFile(file, "documents", "admin")
        console.log("✅ Upload vers documents réussi:", uploadResult)
      } catch (documentsError) {
        console.error("❌ Échec upload vers tous les buckets:", documentsError)
        return NextResponse.json(
          { success: false, error: "Erreur upload fichier", details: documentsError.message },
          { status: 500 },
        )
      }
    }

    // Enregistrer dans uploaded_files (optionnel)
    try {
      const { data: fileRecord } = await supabase
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

      console.log("✅ Fichier enregistré en DB:", fileRecord)
    } catch (dbError) {
      console.warn("⚠️ Erreur enregistrement DB (non critique):", dbError)
    }

    // Mettre à jour les paramètres du site
    try {
      // Récupérer les logos actuels
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

      if (updateError) {
        console.error("❌ Erreur update settings:", updateError)
        return NextResponse.json(
          { success: false, error: "Erreur mise à jour paramètres", details: updateError.message },
          { status: 500 },
        )
      }

      console.log("✅ Paramètres mis à jour")
    } catch (settingsError) {
      console.error("❌ Erreur gestion paramètres:", settingsError)
      return NextResponse.json(
        { success: false, error: "Erreur paramètres", details: settingsError.message },
        { status: 500 },
      )
    }

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
