import { type NextRequest, NextResponse } from "next/server"
import { docuSignService } from "@/lib/docusign-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id

    console.log("🔍 [DOCUSIGN-STATUS] Vérification statut signature:", leaseId)

    const status = await docuSignService.checkSignatureStatus(leaseId)

    return NextResponse.json({
      success: true,
      ...status,
    })
  } catch (error) {
    console.error("❌ [DOCUSIGN-STATUS] Erreur:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur serveur",
      },
      { status: 500 },
    )
  }
}
