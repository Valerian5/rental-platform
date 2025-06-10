import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id
    const body = await request.json()
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: "property_id est requis" }, { status: 400 })
    }

    console.log("🔄 Mise à jour conversation", conversationId, "avec propriété", property_id)

    // Vérifier que la propriété existe
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, title")
      .eq("id", property_id)
      .single()

    if (propertyError || !property) {
      console.error("❌ Propriété non trouvée:", property_id, propertyError)
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    // Mettre à jour la conversation
    const { data: updatedConversation, error: updateError } = await supabase
      .from("conversations")
      .update({ property_id })
      .eq("id", conversationId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Erreur mise à jour conversation:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour de la conversation" }, { status: 500 })
    }

    console.log("✅ Conversation mise à jour:", updatedConversation.id, "avec propriété:", property.title)

    return NextResponse.json({
      conversation: updatedConversation,
      property: property,
    })
  } catch (error) {
    console.error("❌ Erreur API update-property:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
