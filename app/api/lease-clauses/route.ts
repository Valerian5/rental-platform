import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const activeOnly = searchParams.get("active") === "true"

    let query = supabase
      .from("lease_clauses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })

    if (category) {
      query = query.eq("category", category)
    }

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data: clauses, error } = await query

    if (error) {
      console.error("Erreur récupération clauses:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des clauses" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      clauses: clauses || [],
    })
  } catch (error) {
    console.error("Erreur API clauses:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, clause_text, is_default = false, is_active = true } = body

    if (!name || !category || !clause_text) {
      return NextResponse.json(
        { success: false, error: "Nom, catégorie et texte de la clause sont requis" },
        { status: 400 },
      )
    }

    // Si c'est une clause par défaut, désactiver les autres clauses par défaut de la même catégorie
    if (is_default) {
      await supabase.from("lease_clauses").update({ is_default: false }).eq("category", category).eq("is_default", true)
    }

    const { data: clause, error } = await supabase
      .from("lease_clauses")
      .insert({
        name,
        category,
        clause_text,
        is_default,
        is_active,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création clause:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la création de la clause" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      clause,
    })
  } catch (error) {
    console.error("Erreur API création clause:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
