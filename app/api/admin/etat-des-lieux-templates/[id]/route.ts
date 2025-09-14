import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"

// GET /api/admin/etat-des-lieux-templates/[id]
// Récupère un modèle spécifique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id
    
    // Vérifier l'authentification admin via le token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier le token et récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      return NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 })
    }

    const { data: template, error } = await supabase
      .from("etat_des_lieux_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Erreur GET template:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT /api/admin/etat-des-lieux-templates/[id]
// Met à jour un modèle
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id
    
    // Vérifier l'authentification admin via le token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier le token et récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      return NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const type = formData.get("type") as "entree" | "sortie"
    const room_count = parseInt(formData.get("room_count") as string)
    const description = formData.get("description") as string
    const file = formData.get("file") as File

    if (!name || !type || !room_count) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Récupérer le modèle existant
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("etat_des_lieux_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 })
    }

    let fileUrl = existingTemplate.file_url
    let fileName = existingTemplate.file_name
    let fileSize = existingTemplate.file_size
    let mimeType = existingTemplate.mime_type

    // Si un nouveau fichier est fourni, l'uploader
    if (file) {
      // Supprimer l'ancien fichier
      if (existingTemplate.file_url) {
        try {
          // Extraire le chemin du fichier de l'URL
          const url = new URL(existingTemplate.file_url)
          const pathParts = url.pathname.split('/')
          const filePath = pathParts.slice(3).join('/') // Enlever /storage/v1/object/public/bucket/
          await SupabaseStorageService.deleteFile(filePath, "etat-des-lieux-templates")
        } catch (error) {
          console.warn("Impossible de supprimer l'ancien fichier:", error)
        }
      }

      // Uploader le nouveau fichier
      const newFileName = `etat-des-lieux-template-${type}-${room_count}pieces-${Date.now()}.pdf`
      const filePath = `admin/etat-des-lieux-templates/${newFileName}`

      const uploadData = await SupabaseStorageService.uploadFile(
        file,
        filePath,
        "etat-des-lieux-templates"
      )

      fileUrl = uploadData.url
      fileName = newFileName
      fileSize = file.size
      mimeType = file.type
    }

    // Mettre à jour le modèle
    const { data: template, error: updateError } = await supabase
      .from("etat_des_lieux_templates")
      .update({
        name,
        type,
        room_count,
        description,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
      })
      .eq("id", templateId)
      .select()
      .single()

    if (updateError) {
      console.error("Erreur mise à jour template:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour du modèle" }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Erreur PUT template:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH /api/admin/etat-des-lieux-templates/[id]
// Met à jour partiellement un modèle (ex: statut actif/inactif)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id
    
    // Vérifier l'authentification admin via le token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier le token et récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      return NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 })
    }

    const body = await request.json()

    const { data: template, error } = await supabase
      .from("etat_des_lieux_templates")
      .update(body)
      .eq("id", templateId)
      .select()
      .single()

    if (error) {
      console.error("Erreur PATCH template:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Erreur PATCH template:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/admin/etat-des-lieux-templates/[id]
// Supprime un modèle
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id
    
    // Vérifier l'authentification admin via le token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier le token et récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "admin") {
      return NextResponse.json({ error: "Accès refusé - Admin requis" }, { status: 403 })
    }

    // Récupérer le modèle pour obtenir l'URL du fichier
    const { data: template, error: fetchError } = await supabase
      .from("etat_des_lieux_templates")
      .select("file_url")
      .eq("id", templateId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 })
    }

    // Supprimer le fichier du storage
    if (template.file_url) {
      try {
        // Extraire le chemin du fichier de l'URL
        const url = new URL(template.file_url)
        const pathParts = url.pathname.split('/')
        const filePath = pathParts.slice(3).join('/') // Enlever /storage/v1/object/public/bucket/
        await SupabaseStorageService.deleteFile(filePath, "etat-des-lieux-templates")
      } catch (error) {
        console.warn("Impossible de supprimer le fichier:", error)
      }
    }

    // Supprimer l'entrée de la base de données
    const { error: deleteError } = await supabase
      .from("etat_des_lieux_templates")
      .delete()
      .eq("id", templateId)

    if (deleteError) {
      console.error("Erreur suppression template:", deleteError)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur DELETE template:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}