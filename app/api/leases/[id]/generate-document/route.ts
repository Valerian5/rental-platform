import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { generateLeaseDocument } from "@/lib/generate-lease-document"
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit"
import { checkSubscription } from "@/lib/subscription"
import prismadb from "@/lib/prismadb"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    if (!params.id) {
      return new NextResponse("Lease ID is required", { status: 400 })
    }

    const lease = await prismadb.lease.findUnique({
      where: {
        userId,
        id: params.id,
      },
    })

    if (!lease) {
      return new NextResponse("Lease not found", { status: 404 })
    }

    // Vérifier seulement les champs vraiment critiques pour la génération
    const criticalMissingFields = []

    if (!lease.bailleur_nom_prenom) criticalMissingFields.push("bailleur_nom_prenom")
    if (!lease.bailleur_email) criticalMissingFields.push("bailleur_email")
    if (!lease.locataire_nom_prenom && !lease.metadata?.locataires?.[0])
      criticalMissingFields.push("locataire_nom_prenom")
    if (!lease.localisation_logement && !lease.adresse_logement) criticalMissingFields.push("adresse_logement")
    if (!lease.surface_habitable) criticalMissingFields.push("surface_habitable")
    if (!lease.nombre_pieces) criticalMissingFields.push("nombre_pieces")
    if (!lease.monthly_rent) criticalMissingFields.push("monthly_rent")
    if (!lease.deposit_amount) criticalMissingFields.push("deposit_amount")
    if (!lease.start_date) criticalMissingFields.push("start_date")
    if (!lease.duree_contrat) criticalMissingFields.push("duree_contrat")

    // Si des champs critiques manquent, retourner une erreur au lieu de rediriger
    if (criticalMissingFields.length > 0) {
      console.log("❌ [GENERATE] Champs critiques manquants:", criticalMissingFields)
      return NextResponse.json(
        {
          success: false,
          error: `Champs critiques manquants: ${criticalMissingFields.join(", ")}`,
          missingFields: criticalMissingFields,
        },
        { status: 400 },
      )
    }

    const isPro = await checkSubscription()

    if (!isPro) {
      const freeTrial = await checkApiLimit()
      if (!freeTrial) {
        return new NextResponse("Free trial has expired. Please upgrade to pro.", { status: 403 })
      }
    }

    const document = await generateLeaseDocument(lease)

    if (!isPro) {
      await increaseApiLimit()
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.log("[LEASE_GENERATE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
