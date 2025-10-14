import { NextResponse } from "next/server"
import { premiumService } from "@/lib/premium-service"

export async function GET() {
  try {
    const plans = await premiumService.getPricingPlans()
    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error("❌ Erreur récupération plans:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
