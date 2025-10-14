"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap } from "lucide-react"
import type { PricingPlan } from "@/lib/premium-service"

interface PremiumPlanSelectorProps {
  currentPlanId?: string
  onPlanSelect: (planId: string) => void
  showTrialOption?: boolean
}

export function PremiumPlanSelector({ currentPlanId, onPlanSelect, showTrialOption = true }: PremiumPlanSelectorProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/premium/plans")
      const data = await response.json()
      if (data.success) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error("❌ Erreur chargement plans:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement des plans...</div>
  }

  return (
    <div className="space-y-6">
      {/* Toggle période de facturation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <Button
            variant={billingPeriod === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingPeriod("monthly")}
          >
            Mensuel
          </Button>
          <Button
            variant={billingPeriod === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingPeriod("yearly")}
          >
            Annuel
            <Badge variant="secondary" className="ml-2">
              -17%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Grille des plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = billingPeriod === "monthly" ? plan.price_monthly : plan.price_yearly
          const priceId =
            billingPeriod === "monthly" ? (plan as any).stripe_price_monthly_id : (plan as any).stripe_price_yearly_id
          const isCurrentPlan = currentPlanId === plan.id
          const yearlyDiscount = plan.price_yearly < plan.price_monthly * 12

          return (
            <Card
              key={plan.id}
              className={`relative ${plan.is_popular ? "border-blue-500 shadow-lg" : ""} ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Populaire
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {plan.is_free ? "Gratuit" : `${price}€`}
                    {!plan.is_free && (
                      <span className="text-sm font-normal text-gray-500">
                        /{billingPeriod === "monthly" ? "mois" : "an"}
                      </span>
                    )}
                  </div>
                  {billingPeriod === "yearly" && yearlyDiscount && !plan.is_free && (
                    <div className="text-sm text-green-600">
                      Économisez {plan.price_monthly * 12 - plan.price_yearly}€/an
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Limites du plan */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Propriétés</span>
                    <span className="font-medium">{plan.max_properties ? plan.max_properties : "Illimité"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Locataires</span>
                    <span className="font-medium">{plan.max_tenants ? plan.max_tenants : "Illimité"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stockage</span>
                    <span className="font-medium">{plan.max_storage_gb}GB</span>
                  </div>
                </div>

                {/* Fonctionnalités incluses */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Fonctionnalités incluses :</h4>
                  <div className="space-y-1">
                    {(() => {
                      const features = (plan as any).features || []
                      const featureLabels: Record<string, string> = {
                        applications: "Candidatures",
                        property_management: "Gestion locative",
                        leases: "Baux",
                        payments: "Paiements",
                        scoring_customization: "Assistant configuration scoring",
                        electronic_signature: "Signature électronique"
                      }
                      
                      return features.slice(0, 5).map((feature: string) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{featureLabels[feature] || feature}</span>
                        </div>
                      ))
                    })()}
                    {((plan as any).features || []).length > 5 && (
                      <div className="text-xs text-gray-500">+{((plan as any).features || []).length - 5} autres fonctionnalités</div>
                    )}
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      <Check className="w-4 h-4 mr-2" />
                      Plan actuel
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={async () => {
                          if (!plan.is_free && priceId) {
                            const resp = await fetch("/api/billing/checkout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                mode: "subscription",
                                priceId,
                                plan_id: plan.id,
                              }),
                            })
                            const data = await resp.json()
                            if (data?.url) {
                              window.location.href = data.url
                              return
                            }
                          }
                          onPlanSelect(plan.id)
                        }}
                        className="w-full"
                        variant={plan.is_popular ? "default" : "outline"}
                      >
                        {plan.is_free ? "Choisir" : "Passer au plan"}
                        {plan.is_popular && <Zap className="w-4 h-4 ml-2" />}
                      </Button>

                      {showTrialOption && !plan.is_free && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={async () => {
                            if (priceId) {
                              const resp = await fetch("/api/billing/checkout", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  mode: "subscription",
                                  priceId,
                                  plan_id: plan.id,
                                  metadata: { trial: "true" },
                                }),
                              })
                              const data = await resp.json()
                              if (data?.url) {
                                window.location.href = data.url
                                return
                              }
                            }
                            onPlanSelect(plan.id + "_trial")
                          }}
                        >
                          Essai gratuit 30 jours
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
