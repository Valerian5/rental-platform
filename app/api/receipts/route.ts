import { type NextRequest, NextResponse } from "next/server"
import { ReceiptServiceBackend } from "@/lib/receipt-service-backend"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données requises
    if (!body.payment_id || !body.lease_id || !body.reference) {
      return NextResponse.json({ 
        success: false, 
        error: "payment_id, lease_id et reference sont requis" 
      }, { status: 400 })
    }

    const receipt = await ReceiptServiceBackend.createReceipt(body)
    
    return NextResponse.json({ 
      success: true, 
      data: receipt 
    })
  } catch (error) {
    console.error("Erreur création quittance:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de quittance requis" 
      }, { status: 400 })
    }

    const { id, ...updates } = body
    const receipt = await ReceiptServiceBackend.updateReceipt(id, updates)
    
    return NextResponse.json({ 
      success: true, 
      data: receipt 
    })
  } catch (error) {
    console.error("Erreur mise à jour quittance:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de quittance requis" 
      }, { status: 400 })
    }

    await ReceiptServiceBackend.deleteReceipt(id)
    
    return NextResponse.json({ 
      success: true, 
      message: "Quittance supprimée avec succès" 
    })
  } catch (error) {
    console.error("Erreur suppression quittance:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}
