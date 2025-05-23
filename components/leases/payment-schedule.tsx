import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Euro } from "lucide-react"

interface PaymentScheduleProps {
  startDate: string
  endDate: string
  monthlyRent: number
  charges: number
}

export function PaymentSchedule({ startDate, endDate, monthlyRent, charges }: PaymentScheduleProps) {
  // Generate payment schedule
  const generateSchedule = () => {
    const schedule = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalAmount = monthlyRent + charges

    const current = new Date(start.getFullYear(), start.getMonth(), 1)

    while (current <= end) {
      schedule.push({
        date: new Date(current),
        amount: totalAmount,
        rent: monthlyRent,
        charges: charges,
      })
      current.setMonth(current.getMonth() + 1)
    }

    return schedule
  }

  const schedule = generateSchedule()
  const totalAmount = schedule.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Échéancier des Paiements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Total sur la période</p>
              <p className="text-sm text-muted-foreground">{schedule.length} mensualités</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{totalAmount}€</p>
              <p className="text-sm text-muted-foreground">{monthlyRent + charges}€/mois</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {schedule.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Euro className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {payment.date.toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Loyer: {payment.rent}€ + Charges: {payment.charges}€
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{payment.amount}€</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
