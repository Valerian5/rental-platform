import { type NextRequest, NextResponse } from "next/server"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 API Upload Supabase - Début")

    // Récupérer les données du formulaire
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = (formData.get("bucket") as string) || "documents"
    const folder = (formData.get("folder") as string) || "general"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    console.log("📁 Fichier reçu:", file.name, "Taille:", file.size)
    console.log("🪣 Bucket:", bucket, "Dossier:", folder)

    // Upload vers Supabase Storage
    const result = await SupabaseStorageService.uploadFile(file, bucket, folder)

    console.log("✅ Upload réussi:", result.url)

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
      size: result.size,
      uploadedAt: result.uploadedAt.toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur API upload:", error)
    return NextResponse.json({ error: `Erreur serveur: ${error.message}` }, { status: 500 })
  }
}
