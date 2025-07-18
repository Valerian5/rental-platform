import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string; annexId: string } }) {
  try {
    const { id: leaseId, annexId } = params

    // Récupérer les infos de l'annexe
    const { data: annexe, error: annexeError } = await supabase
      .from("lease_annexes")
      .select("*")
      .eq("id", annexId)
      .eq("lease_id", leaseId)
      .single()

    if (annexeError || !annexe) {
      return NextResponse.json({ success: false, error: "Annexe non trouvée" }, { status: 404 })
    }

    // Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("lease-annexes")
      .download(annexe.file_path)

    if (downloadError) {
      console.error("Erreur téléchargement:", downloadError)
      return NextResponse.json({ success: false, error: "Erreur lors du téléchargement" }, { status: 500 })
    }

    // Retourner le fichier
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${annexe.name}"`,
      },
    })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; annexId: string } }) {
  try {
    const { id: leaseId, annexId } = params

    // Récupérer les infos de l'annexe
    const { data: annexe, error: annexeError } = await supabase
      .from("lease_annexes")
      .select("*")
      .eq("id", annexId)
      .eq("lease_id", leaseId)
      .single()

    if (annexeError || !annexe) {
      return NextResponse.json({ success: false, error: "Annexe non trouvée" }, { status: 404 })
    }

    // Supprimer le fichier du storage
    const { error: deleteFileError } = await supabase.storage.from("lease-annexes").remove([annexe.file_path])

    if (deleteFileError) {
      console.error("Erreur suppression fichier:", deleteFileError)
    }

    // Supprimer l'enregistrement de la base
    const { error: deleteDbError } = await supabase.from("lease_annexes").delete().eq("id", annexId)

    if (deleteDbError) {
      console.error("Erreur suppression base:", deleteDbError)
      return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Annexe supprimée avec succès",
    })
  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
