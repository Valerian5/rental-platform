import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Euro, Calendar, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"

interface Payment {
  id: string
  dueDate: string
  amount: number
  status: "pending" | "paid" | "overdue"
  paidDate?: string
}

interface RentPaymentsProps {
  payments: Payment[]
}

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Payé", color: "bg-green-100 text-green-800", icon: CheckCircle },
  overdue: { label: "En retard", color: "bg-red-100 text-red-800", icon: AlertCircle },
}

export function RentPayments({ payments }: RentPaymentsProps) {
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total payé</p>
                <p className="text-2xl font-bold text-green-600">{totalPaid}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{totalPending}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En retard</p>
                <p className="text-2xl font-bold text-red-600">{totalOverdue}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Historique des Paiements
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Enregistrer un paiement
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => {
              const status = statusConfig[payment.status]
              const StatusIcon = status.icon

              return (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Euro className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Loyer - {payment.amount}€</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Échéance: {new Date(payment.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                        {payment.paidDate && (
                          <>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              Payé le: {new Date(payment.paidDate).toLocaleDateString("fr-FR")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge className={status.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
