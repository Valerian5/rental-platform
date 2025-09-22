"use client"

import { PaymentTestComponent } from "@/components/PaymentTestComponent"

export default function TestPaymentsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test du Module de Paiements</h1>
        <p className="text-gray-600">
          Cette page vous permet de tester l'installation et le fonctionnement du module de gestion des paiements.
        </p>
      </div>
      
      <PaymentTestComponent />
    </div>
  )
}
