import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseStorageService } from "@/lib/supabase-storage-service"

// GET /api/admin/etat-des-lieux-templates
// Récupère tous les modèles d'état des lieux
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin via l'email
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

    const { data: templates, error } = await supabase
      .from("etat_des_lieux_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération templates:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des modèles" }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error("Erreur GET templates:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/admin/etat-des-lieux-templates
// Crée un nouveau modèle d'état des lieux
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin via l'email
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

    if (!name || !type || !room_count || !file) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Upload du fichier vers Supabase Storage
    const fileName = `etat-des-lieux-template-${type}-${room_count}pieces-${Date.now()}.pdf`
    const filePath = `admin/etat-des-lieux-templates/${fileName}`

    const { data: uploadData, error: uploadError } = await supabaseStorageService.uploadFile(
      file,
      filePath,
      "etat-des-lieux-templates"
    )

    if (uploadError) {
      console.error("Erreur upload:", uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 })
    }

    // Créer l'entrée en base de données
    const { data: template, error: dbError } = await supabase
      .from("etat_des_lieux_templates")
      .insert({
        name,
        type,
        room_count,
        description,
        file_url: uploadData.url,
        file_name: fileName,
        file_size: file.size,
        mime_type: file.type,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Erreur création template:", dbError)
      return NextResponse.json({ error: "Erreur lors de la création du modèle" }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Erreur POST template:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
