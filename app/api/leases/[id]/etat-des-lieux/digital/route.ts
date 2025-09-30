import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/leases/[id]/etat-des-lieux/digital
// Récupère un état des lieux numérique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'entree'
    const server = createServerClient()

    // Récupérer l'état des lieux numérique
    const { data: document, error } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", type)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Erreur récupération numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ data: { general_info: null, rooms: [] }, status: "draft" })
    }

    return NextResponse.json({ data: document.digital_data || { general_info: null, rooms: [] }, status: document.status })
  } catch (error) {
    console.error("Erreur GET digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/leases/[id]/etat-des-lieux/digital
// Sauvegarde un état des lieux numérique
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { general_info, rooms, property_data, lease_data, owner_signature, tenant_signature, validated, new_version } = await request.json()
    const server = createServerClient()

    // Vérifier que le bail existe
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    // Préparer les données numériques
    const digitalData = {
      general_info,
      rooms,
      property_data,
      lease_data,
      signatures: {
        owner: owner_signature || null,
        tenant: tenant_signature || null,
      },
      created_at: new Date().toISOString(),
    }

    const docType = (general_info?.type || "entree") as string

    // Chercher un document existant (sauf si on force une nouvelle version)
    const { data: existing, error: findError } = new_version
      ? { data: null as any, error: null as any }
      : await server
      .from("etat_des_lieux_documents")
      .select("id")
      .eq("lease_id", leaseId)
      .eq("type", docType)
      .maybeSingle()

    if (findError) {
      console.error("Erreur recherche document existant:", findError)
    }

    let document: any = null
    let error: any = null

    if (existing?.id) {
      const { data, error: updateError } = await server
        .from("etat_des_lieux_documents")
        .update({
          property_id: lease.property_id,
          status: validated ? (owner_signature && tenant_signature ? "signed" : "completed") : "draft",
          digital_data: digitalData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()
      document = data
      error = updateError
    } else {
      const { data, error: insertError } = await server
        .from("etat_des_lieux_documents")
        .insert({
          lease_id: leaseId,
          property_id: lease.property_id,
          type: docType,
          status: validated ? (owner_signature && tenant_signature ? "signed" : "completed") : "draft",
          digital_data: digitalData,
        })
        .select()
        .single()
      document = data
      error = insertError
    }

    if (error) {
      console.error("Erreur sauvegarde numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    // Si validé et signatures présentes, générer un PDF minimal et le stocker
    if (validated && owner_signature && tenant_signature) {
      try {
        const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")

        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([595.28, 841.89]) // A4
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

        const drawText = (text: string, x: number, y: number, size = 12) => {
          page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
        }

        let y = 800
        drawText(`État des lieux ${docType === "entree" ? "d'entrée" : "de sortie"}`, 40, y, 18)
        y -= 24
        drawText(`Bail: ${leaseId}`, 40, y)
        y -= 16
        drawText(`Adresse: ${lease_data?.adresse_logement || ""}`.slice(0, 90), 40, y)
        y -= 24
        drawText(`Date: ${general_info?.date || new Date().toISOString().slice(0,10)}`, 40, y)
        y -= 24
        drawText(`Propriétaire: ${general_info?.owner?.first_name || ""} ${general_info?.owner?.last_name || ""}`.trim(), 40, y)
        y -= 16
        drawText(`Locataire: ${general_info?.tenant?.first_name || ""} ${general_info?.tenant?.last_name || ""}`.trim(), 40, y)
        y -= 32

        // Intégrer les signatures (PNG base64)
        const toBytes = (dataUrl: string) => {
          const base64 = dataUrl.split(",")[1] || ""
          return Buffer.from(base64, "base64")
        }

        try {
          const ownerPng = await pdfDoc.embedPng(toBytes(owner_signature))
          const tenantPng = await pdfDoc.embedPng(toBytes(tenant_signature))
          const sigWidth = 180
          const sigHeight = 60
          page.drawText("Signature propriétaire:", { x: 40, y: y })
          page.drawImage(ownerPng, { x: 40, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
          page.drawText("Signature locataire:", { x: 320, y: y })
          page.drawImage(tenantPng, { x: 320, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
        } catch (e) {
          console.warn("Signature embedding failed:", e)
        }

        // Ajouter pages tableau par pièce (comme la preview)
        try {
          const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
          const tableMarginX = 40
          const tableWidth = 515
          const headerHeight = 22
          const rowHeight = 18
          const pageHeight = 841.89
          const bottomMargin = 40

          const drawTableHeader = (p: any, startY: number, isExitType: boolean) => {
            const columns = isExitType
              ? [
                  { label: "Élément", width: 220 },
                  { label: "Entrée", width: 90 },
                  { label: "Sortie", width: 90 },
                  { label: "Commentaire", width: 115 },
                ]
              : [
                  { label: "Élément", width: 250 },
                  { label: "État", width: 110 },
                  { label: "Commentaire", width: 155 },
                ]
            let x = tableMarginX
            p.drawText(columns[0].label, { x, y: startY - 16, size: 11, font: bold })
            for (let i = 1; i < columns.length; i++) {
              x += columns[i - 1].width
              p.drawText(columns[i].label, { x, y: startY - 16, size: 11, font: bold })
            }
            p.drawLine({ start: { x: tableMarginX, y: startY - headerHeight }, end: { x: tableMarginX + tableWidth, y: startY - headerHeight }, thickness: 1 })
            return { columns }
          }

          const drawRow = (p: any, rowY: number, cols: any[], values: string[]) => {
            // Texte
            let x = tableMarginX
            for (let i = 0; i < cols.length; i++) {
              const val = (values[i] || "").toString().slice(0, 60)
              p.drawText(val, { x: x + 2, y: rowY - 13, size: 10, font })
              x += cols[i].width
            }
            // Ligne horizontale
            p.drawLine({ start: { x: tableMarginX, y: rowY - rowHeight }, end: { x: tableMarginX + tableWidth, y: rowY - rowHeight }, thickness: 0.5 })
          }

          const ensureSpace = (currentPage: any, yPos: number) => {
            if (yPos - rowHeight < bottomMargin) {
              return pdfDoc.addPage([595.28, 841.89])
            }
            return currentPage
          }

          // Itération des pièces
          const isExit = (general_info?.type || "entree") === "sortie"
          let p = page
          let currentY = 640 // sous les signatures
          const roomsArray: any[] = Array.isArray(rooms) ? rooms : []
          for (const room of roomsArray) {
            // Nouvelle page si manque d'espace pour titre
            if (currentY - 40 < bottomMargin) {
              p = pdfDoc.addPage([595.28, pageHeight])
              currentY = pageHeight - 60
            }
            // Titre pièce
            p.drawText(`Pièce: ${room.name || room.id || ""}`.slice(0, 60), { x: 40, y: currentY, size: 14, font: bold })
            currentY -= 10
            p.drawLine({ start: { x: 40, y: currentY }, end: { x: 555, y: currentY }, thickness: 0.5 })
            currentY -= 10

            // En-tête du tableau
            const { columns } = drawTableHeader(p, currentY, isExit)
            currentY -= headerHeight

            // Lignes des éléments
            const elements = room?.elements ? Object.keys(room.elements) : []
            for (const key of elements) {
              p = ensureSpace(p, currentY)
              if (p.getY) {
                // noop pour typings
              }
              // Si page changée, réinitialiser Y et redessiner titre/table header
              if (currentY - rowHeight < bottomMargin) {
                p = pdfDoc.addPage([595.28, pageHeight])
                currentY = pageHeight - 80
                p.drawText(`Pièce: ${room.name || room.id || ""}`.slice(0, 60), { x: 40, y: currentY, size: 14, font: bold })
                currentY -= 10
                p.drawLine({ start: { x: 40, y: currentY }, end: { x: 555, y: currentY }, thickness: 0.5 })
                currentY -= 10
                drawTableHeader(p, currentY, isExit)
                currentY -= headerHeight
              }

              const el = room.elements[key] || {}
              const label = key.charAt(0).toUpperCase() + key.slice(1)
              if (isExit) {
                drawRow(p, currentY, columns, [label, el.state_entree || el.state || "", el.state_sortie || "", el.comment || ""]) 
              } else {
                drawRow(p, currentY, columns, [label, el.state || "", el.comment || ""]) 
              }
              currentY -= rowHeight
            }

            currentY -= 16
          }
        } catch (e) {
          console.warn("Erreur tableaux EDL:", e)
        }

        // Ajouter une page photos (aperçu) si disponible
        try {
          const allPhotos: string[] = Array.isArray(rooms)
            ? rooms.flatMap((r: any) => Array.isArray(r.photos) ? r.photos : [])
            : []
          const photos = allPhotos.slice(0, 6) // Limite à 6 pour la taille
          if (photos.length > 0) {
            const photoPage = pdfDoc.addPage([595.28, 841.89])
            const photoTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
            photoPage.drawText("Photos principales", { x: 40, y: 800, size: 16, font: photoTitle })

            let px = 40
            let py = 760
            const cellW = 160
            const cellH = 110
            const gap = 20

            for (let i = 0; i < photos.length; i++) {
              const url = photos[i]
              try {
                const resp = await fetch(url)
                if (resp.ok) {
                  const arrayBuf = await resp.arrayBuffer()
                  const bytes = new Uint8Array(arrayBuf)
                  const contentType = resp.headers.get("content-type") || ""
                  let img
                  if (contentType.includes("png")) {
                    img = await pdfDoc.embedPng(bytes)
                  } else {
                    img = await pdfDoc.embedJpg(bytes)
                  }
                  const scale = Math.min(cellW / img.width, cellH / img.height)
                  const w = img.width * scale
                  const h = img.height * scale
                  photoPage.drawImage(img, { x: px, y: py - h, width: w, height: h })
                }
              } catch (e) {
                console.warn("Erreur intégration photo:", e)
              }

              px += cellW + gap
              if ((i + 1) % 3 === 0) {
                px = 40
                py -= cellH + gap
              }
            }
          }
        } catch (e) {
          console.warn("Erreur page photos:", e)
        }

        const pdfBytes = await pdfDoc.save()

        // Upload vers Supabase Storage
        const filePath = `etat-des-lieux/${leaseId}-${docType}.pdf`
        const { error: uploadError } = await server.storage
          .from("documents")
          .upload(filePath, Buffer.from(pdfBytes), { contentType: "application/pdf", upsert: true })

        if (!uploadError) {
          const { data: publicData } = server.storage.from("documents").getPublicUrl(filePath)

          // Mettre à jour le document avec l'URL
          await server
            .from("etat_des_lieux_documents")
            .update({
              file_url: publicData.publicUrl,
              file_name: `${leaseId}-${docType}.pdf`,
              mime_type: "application/pdf",
              status: "signed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", document.id)

          // Notifications + Email au locataire
          try {
            // Récupérer infos bail minimal (tenant/owner)
            const { data: leaseRow } = await server
              .from("leases")
              .select("id, tenant_id, locataire_id, owner_id, bailleur_id, property_id")
              .eq("id", leaseId)
              .maybeSingle()

            const tenantId = (leaseRow as any)?.tenant_id || (leaseRow as any)?.locataire_id
            const ownerId = (leaseRow as any)?.owner_id || (leaseRow as any)?.bailleur_id

            // Notification classique au locataire
            if (tenantId) {
              try {
                const { notificationsService } = await import("@/lib/notifications-service")
                await notificationsService.createNotification(tenantId, {
                  type: "etat_des_lieux_signed",
                  title: "État des lieux signé disponible",
                  content: "Votre état des lieux signé est disponible au téléchargement.",
                  action_url: `/tenant/leases/${leaseId}`,
                })
              } catch (e) {
                console.warn("Notification EDL tenant échouée:", e)
              }
            }

            // Email au locataire avec lien de téléchargement
            if (tenantId) {
              try {
                const { data: tenantUser } = await server
                  .from("users")
                  .select("id, first_name, last_name, email")
                  .eq("id", tenantId)
                  .maybeSingle()

                const { data: property } = await server
                  .from("properties")
                  .select("id, title, address")
                  .eq("id", lease.property_id)
                  .maybeSingle()

                if (tenantUser?.email) {
                  const { sendLeaseDocumentEmail } = await import("@/lib/email-service")
                  await sendLeaseDocumentEmail(
                    { id: tenantUser.id, name: `${tenantUser.first_name || ""} ${tenantUser.last_name || ""}`.trim(), email: tenantUser.email },
                    { id: property?.id || lease.property_id, title: property?.title || "Votre logement", address: property?.address || "" },
                    publicData.publicUrl,
                  )
                }
              } catch (e) {
                console.warn("Email EDL tenant échoué:", e)
              }
            }

            // Optionnel: notification au propriétaire
            if (ownerId) {
              try {
                const { notificationsService } = await import("@/lib/notifications-service")
                await notificationsService.createNotification(ownerId, {
                  type: "etat_des_lieux_signed",
                  title: "État des lieux signé disponible",
                  content: "Le document signé est disponible.",
                  action_url: `/owner/leases/${leaseId}`,
                })
              } catch (e) {
                console.warn("Notification EDL owner échouée:", e)
              }
            }
          } catch (e) {
            console.warn("Notifications/Emails EDL échoués:", e)
          }
        }
      } catch (e) {
        console.error("Erreur génération/enregistrement PDF état des lieux:", e)
      }
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Erreur digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
