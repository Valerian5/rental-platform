import { NextResponse } from "next/server"
import { premiumService } from "@/lib/premium-service"

export async function GET() {
  try {
    const plans = await premiumService.getPricingPlans()
    return new NextResponse(JSON.stringify({ success: true, plans }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("❌ Erreur récupération plans:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
