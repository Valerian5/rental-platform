"use client"

import React, { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { Download, Loader2 } from "lucide-react"

// Schéma de validation pour les informations du garant
const guarantorSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  address: z.string().min(1, "L'adresse est requise."),
  birthDate: z.string().min(1, "La date de naissance est requise."),
  birthPlace: z.string().min(1, "Le lieu de naissance est requis."),
})

type GuarantorFormData = z.infer<typeof guarantorSchema>

interface CautionnementGeneratorProps {
  leaseId: string
  leaseData: {
    locataire_nom_prenom: string
    bailleur_nom_prenom: string
    bailleur_adresse: string
    adresse_logement: string
    montant_loyer_mensuel: number
    date_prise_effet: string
    duree_contrat: number
  }
}

export function CautionnementGenerator({ leaseId, leaseData }: CautionnementGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const form = useForm<GuarantorFormData>({
    resolver: zodResolver(guarantorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      birthDate: "",
      birthPlace: "",
    },
  })

  const onSubmit = async (data: GuarantorFormData) => {
    setIsGenerating(true)
    toast.info("Génération de l'acte de cautionnement en cours...")
    
    try {
      const response = await fetch(`/api/leases/${leaseId}/generate-cautionnement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guarantor: {
            ...data,
            name: `${data.firstName} ${data.lastName}`,
          },
          leaseData: leaseData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Une erreur est survenue.")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `acte-de-cautionnement-${leaseId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success("L'acte de cautionnement a été généré avec succès.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la génération du PDF.",
      )
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Génération de l'Acte de Cautionnement</CardTitle>
        <CardDescription>
          Remplissez les informations de la personne se portant caution pour
          générer le document PDF conforme au modèle légal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom de la caution</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la caution</FormLabel>
                    <FormControl>
                      <Input placeholder="Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse complète de la caution</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Rue de la Paix, 75001 Paris" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu de naissance</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Générer l'Acte de Cautionnement
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

