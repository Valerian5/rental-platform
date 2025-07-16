import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📋 [API] Récupération annexes pour bail:", params.id)

    const { data: annexes, error } = await supabase
      .from("lease_annexes")
      .select("*")
      .eq("lease_id", params.id)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("❌ [API] Erreur récupération annexes:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération" }, { status: 500 })
    }

    console.log("✅ [API] Annexes récupérées:", annexes?.length || 0)

    return NextResponse.json({
      success: true,
      annexes: annexes || [],
    })
  } catch (error) {
    console.error("❌ [API] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📤 [API] Upload annexe pour bail:", params.id)

    const formData = await request.formData()
    const file = formData.get("file") as File
    const annexType = formData.get("annexType") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni" }, { status: 400 })
    }

    console.log("📄 [API] Fichier reçu:", file.name, "type:", annexType)

    // Vérifier que le bail existe et récupérer les infos nécessaires
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("id, owner_id, tenant_id")
      .eq("id", params.id)
      .single()

    if (leaseError) {
      console.error("❌ [API] Bail non trouvé:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    console.log("📋 [API] Bail trouvé:", lease.id, "owner:", lease.owner_id)

    // Upload vers Supabase Storage avec fallback automatique
    console.log("🪣 [API] Tentative upload avec fallback automatique")
    const result = await SupabaseStorageService.uploadFile(file, "documents", `leases/${params.id}`)

    console.log("✅ [API] Fichier uploadé:", result.url, "dans bucket:", result.bucket)

    // Sauvegarder les métadonnées avec plus de logs
    const annexData = {
      lease_id: params.id,
      annex_type: annexType || "other",
      file_name: file.name,
      file_url: result.url,
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
    }

    console.log("💾 [API] Données à insérer:", annexData)

    // Utiliser le client Supabase avec auth bypass pour debug
    const { data: savedAnnex, error: saveError } = await supabase
      .from("lease_annexes")
      .insert(annexData)
      .select()
      .single()

    if (saveError) {
      console.error("❌ [API] Erreur sauvegarde annexe:", saveError)
      console.error("📋 [API] Code erreur:", saveError.code)
      console.error("📋 [API] Message:", saveError.message)
      console.error("📋 [API] Détails:", saveError.details)

      // Supprimer le fichier uploadé en cas d'erreur
      try {
        const url = new URL(result.url)
        const pathParts = url.pathname.split("/")
        if (pathParts.length >= 6) {
          const filePath = pathParts.slice(6).join("/")
          await SupabaseStorageService.deleteFile(filePath, result.bucket)
        }
      } catch (deleteError) {
        console.warn("⚠️ [API] Impossible de supprimer le fichier après erreur:", deleteError)
      }

      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la sauvegarde: " + saveError.message,
          code: saveError.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ [API] Annexe sauvegardée avec ID:", savedAnnex.id)

    return NextResponse.json({
      success: true,
      annex: savedAnnex,
    })
  } catch (error) {
    console.error("❌ [API] Erreur upload annexe:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
