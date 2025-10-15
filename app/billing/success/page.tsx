import Link from "next/link"
export default function BillingSuccessPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const sessionId = (searchParams?.session_id as string) || undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Paiement confirmé ✅</h1>
      <p className="text-gray-600 mb-6">
        Merci ! Votre paiement a été traité avec succès. Votre abonnement sera activé automatiquement dans l'application dès réception du webhook Stripe.
      </p>
      {sessionId && (
        <p className="text-sm text-gray-500 mb-6">Session: {sessionId}</p>
      )}
      <Link href="/owner/subscription" className="text-primary underline">
        Retour à Mon abonnement
      </Link>
    </div>
  )
}


