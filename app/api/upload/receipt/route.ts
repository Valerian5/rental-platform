import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Fichier trop volumineux (max 10MB)" }, { status: 400 })
    }

    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Type de fichier non autorisé" }, { status: 400 })
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `receipt_${user.id}_${timestamp}.${fileExtension}`

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error("Erreur upload:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de l'upload" }, { status: 500 })
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      fileName: fileName
    })
  } catch (error) {
    console.error("Erreur API upload:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}
