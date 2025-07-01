import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clauseId = params.id

    const { data: clause, error } = await supabase.from("lease_clauses").select("*").eq("id", clauseId).single()

    if (error) {
      console.error("Erreur récupération clause:", error)
      return NextResponse.json({ success: false, error: "Clause non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      clause,
    })
  } catch (error) {
    console.error("Erreur API clause:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clauseId = params.id
    const body = await request.json()
    const { name, category, clause_text, is_default, is_active } = body

    if (!name || !category || !clause_text) {
      return NextResponse.json(
        { success: false, error: "Nom, catégorie et texte de la clause sont requis" },
        { status: 400 },
      )
    }

    // Si c'est une clause par défaut, désactiver les autres clauses par défaut de la même catégorie
    if (is_default) {
      await supabase
        .from("lease_clauses")
        .update({ is_default: false })
        .eq("category", category)
        .eq("is_default", true)
        .neq("id", clauseId)
    }

    const { data: clause, error } = await supabase
      .from("lease_clauses")
      .update({
        name,
        category,
        clause_text,
        is_default: is_default || false,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clauseId)
      .select()
      .single()

    if (error) {
      console.error("Erreur modification clause:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la modification de la clause" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      clause,
    })
  } catch (error) {
    console.error("Erreur API modification clause:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clauseId = params.id

    const { error } = await supabase.from("lease_clauses").delete().eq("id", clauseId)

    if (error) {
      console.error("Erreur suppression clause:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la suppression de la clause" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Clause supprimée avec succès",
    })
  } catch (error) {
    console.error("Erreur API suppression clause:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
