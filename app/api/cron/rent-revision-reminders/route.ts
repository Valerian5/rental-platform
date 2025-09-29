import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export async function GET() {
  try {
    const supabase = createServerClient()

    const today = new Date()
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const in30Days = addDays(dayStart, 30)

    // Charger les baux actifs avec date de révision
    const { data: leases, error } = await supabase
      .from('leases')
      .select(`
        id,
        property_id,
        owner:users!leases_owner_id_fkey(id, email, first_name, last_name),
        tenant:users!leases_tenant_id_fkey(id, email, first_name, last_name),
        start_date,
        date_revision_loyer,
        status
      `)
      .eq('status', 'active')

    if (error) throw error

    const candidates = (leases || []).filter((lease: any) => lease.date_revision_loyer)

    const reminders: any[] = []
    for (const lease of candidates) {
      const start = new Date(lease.start_date)
      const base = new Date(lease.date_revision_loyer)

      // Calculer la date d’ancrage pour cette année
      const thisYearAnchor = new Date(dayStart.getFullYear(), base.getMonth(), base.getDate())

      // Première éligibilité = start + 1 an
      const firstEligible = new Date(start)
      firstEligible.setFullYear(firstEligible.getFullYear() + 1)

      // Si cette année l’ancrage est avant la première éligibilité, on prend la première éligibilité
      const anchor = thisYearAnchor < firstEligible ? firstEligible : thisYearAnchor

      const anchorStr = anchor.toISOString().split('T')[0]
      const dayStartStr = dayStart.toISOString().split('T')[0]
      const in30Str = in30Days.toISOString().split('T')[0]

      const isToday = anchorStr === dayStartStr
      const isIn30Days = anchorStr === in30Str

      if (isToday || isIn30Days) {
        reminders.push({ lease, anchor, type: isToday ? 'today' : '30_days' })
      }
    }

    // Créer notifications in-app et email
    for (const r of reminders) {
      const { lease, anchor, type } = r
      const title = type === 'today' ? 'Révision de loyer disponible' : 'Révision de loyer dans 30 jours'
      const content = type === 'today'
        ? `Vous pouvez réviser le loyer à partir d'aujourd'hui (${anchor.toLocaleDateString('fr-FR')}).`
        : `Vous pourrez réviser le loyer à partir du ${anchor.toLocaleDateString('fr-FR')}.`

      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: lease.owner.id,
            title,
            content,
            type: 'rent_revision',
            action_url: '/owner/rental-management/rent-revision'
          })
        })
      } catch (e) {
        console.error('Notification in-app échouée:', e)
      }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/revisions/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leaseId: lease.id,
            propertyId: lease.property_id,
            notificationType: 'reminder',
            title,
            message: content,
            recipientType: 'owner',
            recipientId: lease.owner.id,
            recipientEmail: lease.owner.email,
            metadata: { anchor: anchor.toISOString(), type }
          })
        })
      } catch (e) {
        console.error('Email de rappel échoué:', e)
      }
    }

    return NextResponse.json({ success: true, reminders: reminders.length })
  } catch (error: any) {
    console.error('❌ Cron rent-revision-reminders error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}


