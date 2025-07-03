import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; annexId: string } }) {
  try {
    console.log("🗑️ [API] Suppression annexe:", params.annexId, "du bail:", params.id)

    // Récupérer l'annexe
    const { data: annex, error: fetchError } = await supabase
      .from("lease_annexes")
      .select("*")
      .eq("id", params.annexId)
      .eq("lease_id", params.id)
      .single()

    if (fetchError) {
      console.error("❌ [API] Annexe non trouvée:", fetchError)
      return NextResponse.json({ success: false, error: "Annexe non trouvée" }, { status: 404 })
    }

    console.log("📄 [API] Annexe à supprimer:", annex.file_name)

    // Supprimer de la base de données
    const { error: dbError } = await supabase.from("lease_annexes").delete().eq("id", params.annexId)

    if (dbError) {
      console.error("❌ [API] Erreur suppression DB:", dbError)
      return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 })
    }

    // Supprimer le fichier physique
    try {
      const url = new URL(annex.file_url)
      const pathParts = url.pathname.split("/")
      if (pathParts.length >= 6) {
        const filePath = pathParts.slice(6).join("/")
        console.log("🗑️ [API] Suppression fichier:", filePath)
        await SupabaseStorageService.deleteFile(filePath, "lease-annexes")
      }
    } catch (urlError) {
      console.warn("⚠️ [API] Impossible de supprimer le fichier physique:", urlError)
    }

    console.log("✅ [API] Annexe supprimée avec succès")

    return NextResponse.json({
      success: true,
      message: "Annexe supprimée avec succès",
    })
  } catch (error) {
    console.error("❌ [API] Erreur suppression annexe:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
