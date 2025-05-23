import { LeaseForm } from "@/components/leases/lease-form"

export default function NewLeasePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau Bail</h1>
        <p className="text-muted-foreground">Créez un nouveau contrat de location</p>
      </div>

      <LeaseForm />
    </div>
  )
}
