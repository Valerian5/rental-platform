import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 POST /api/admin/upload-logo - DÉBUT")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const logoType = formData.get("logoType") as string

    console.log("📋 Données reçues:", {
      fileName: file?.name,
      logoType,
      fileSize: file?.size,
      fileType: file?.type,
    })

    if (!file || !logoType) {
      console.log("❌ Fichier ou type manquant")
      return NextResponse.json(
        {
          success: false,
          error: "Fichier ou type manquant",
        },
        { status: 400 },
      )
    }

    // Valider le type de fichier
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      console.log("❌ Type de fichier non autorisé:", file.type)
      return NextResponse.json(
        {
          success: false,
          error: "Type de fichier non autorisé",
        },
        { status: 400 },
      )
    }

    // Valider la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log("❌ Fichier trop volumineux:", file.size)
      return NextResponse.json(
        {
          success: false,
          error: "Fichier trop volumineux (max 5MB)",
        },
        { status: 400 },
      )
    }

    console.log("✅ Validation OK, tentative d'upload...")

    // Créer le client Supabase
    const supabase = createServerClient()
    console.log("✅ Client Supabase créé")

    // Convertir le fichier en buffer
    const fileBuffer = await file.arrayBuffer()
    const fileName = `${logoType}_${Date.now()}.${file.name.split(".").pop()}`
    const filePath = `admin/${fileName}`

    console.log("📁 Tentative d'upload vers:", filePath)

    // Essayer d'uploader vers le bucket logos
    let uploadResult
    try {
      const { data: logoUpload, error: logoError } = await supabase.storage.from("logos").upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

      if (logoError) {
        console.log("⚠️ Échec upload vers logos:", logoError.message)
        throw logoError
      }

      console.log("✅ Upload vers logos réussi:", logoUpload)

      // Obtenir l'URL publique
      const { data: publicUrl } = supabase.storage.from("logos").getPublicUrl(filePath)

      uploadResult = {
        path: filePath,
        url: publicUrl.publicUrl,
      }
    } catch (logoError) {
      console.log("⚠️ Échec upload vers logos, tentative vers documents...")

      try {
        const { data: docUpload, error: docError } = await supabase.storage
          .from("documents")
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: true,
          })

        if (docError) {
          console.log("❌ Échec upload vers documents:", docError.message)
          throw docError
        }

        console.log("✅ Upload vers documents réussi:", docUpload)

        // Obtenir l'URL publique
        const { data: publicUrl } = supabase.storage.from("documents").getPublicUrl(filePath)

        uploadResult = {
          path: filePath,
          url: publicUrl.publicUrl,
        }
      } catch (docError) {
        console.error("❌ Échec upload vers tous les buckets:", docError)
        return NextResponse.json(
          {
            success: false,
            error: "Erreur upload fichier",
            details: docError.message,
          },
          { status: 500 },
        )
      }
    }

    console.log("✅ Upload terminé:", uploadResult)

    // Essayer d'enregistrer dans uploaded_files (optionnel)
    try {
      const { data: fileRecord, error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          filename: fileName,
          original_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_url: uploadResult.url,
          category: `logo_${logoType}`,
        })
        .select()
        .single()

      if (dbError) {
        console.warn("⚠️ Erreur enregistrement uploaded_files (non critique):", dbError.message)
      } else {
        console.log("✅ Fichier enregistré en DB:", fileRecord)
      }
    } catch (dbError) {
      console.warn("⚠️ Erreur DB uploaded_files (non critique):", dbError)
    }

    // Essayer de mettre à jour les paramètres du site
    try {
      // Vérifier si la table site_settings existe
      const { data: tableCheck, error: tableError } = await supabase
        .from("site_settings")
        .select("setting_key")
        .limit(1)

      if (tableError) {
        console.warn("⚠️ Table site_settings non accessible:", tableError.message)
        console.log("⚠️ Continuons sans sauvegarder les paramètres")
      } else {
        console.log("✅ Table site_settings accessible")

        // Récupérer les logos actuels
        const { data: currentLogos, error: getError } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "logos")
          .single()

        const logos = currentLogos?.setting_value || {}
        logos[logoType] = uploadResult.url

        // Utiliser upsert avec on_conflict pour gérer la contrainte unique
        const { error: updateError } = await supabase.from("site_settings").upsert({
          setting_key: "logos",
          setting_value: logos,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key'
        })

        if (updateError) {
          console.warn("⚠️ Erreur update settings (non critique):", updateError.message)
        } else {
          console.log("✅ Paramètres mis à jour")
        }
      }
    } catch (settingsError) {
      console.warn("⚠️ Erreur gestion paramètres (non critique):", settingsError)
    }

    console.log("✅ Upload logo terminé avec succès")

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        filename: fileName,
        logoType,
      },
    })
  } catch (error) {
    console.error("❌ Erreur générale upload logo:", error)
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
