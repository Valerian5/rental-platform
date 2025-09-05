"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const guarantorSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis."),
  last_name: z.string().min(1, "Le nom est requis."),
  address: z.string().min(1, "L'adresse est requise."),
  birth_date: z.date({ required_error: "La date de naissance est requise." }),
  birth_place: z.string().min(1, "Le lieu de naissance est requis."),
  bond_type: z.enum(["solidary", "simple"]),
  duration_type: z.enum(["undetermined", "determined"]),
  duration_end_date: z.date().optional(),
})

type GuarantorFormData = z.infer<typeof guarantorSchema>

interface CautionnementGeneratorProps {
  leaseId: string
}

export default function CautionnementGenerator({
  leaseId,
}: CautionnementGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<GuarantorFormData>({
    resolver: zodResolver(guarantorSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      address: "",
      birth_place: "",
      bond_type: "solidary",
      duration_type: "undetermined",
    },
  })

  const durationType = form.watch("duration_type")

  const onSubmit = async (values: GuarantorFormData) => {
    setIsGenerating(true)
    try {
      if (
        values.duration_type === "determined" &&
        !values.duration_end_date
      ) {
        toast.error("Veuillez spécifier une date de fin pour la durée déterminée.")
        return
      }

      const response = await fetch(
        `/api/leases/${leaseId}/generate-cautionnement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guarantor: values }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || "Erreur lors de la génération du document.",
        )
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `acte-de-caution-${leaseId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success("L'acte de cautionnement a été généré.")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générer l'Acte de Cautionnement</CardTitle>
        <CardDescription>
          Remplissez les informations de la personne se portant caution pour
          générer le document PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
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
                name="last_name"
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
                name="birth_date"
                render={({ field }) => (
                   <FormItem className="flex flex-col">
                     <FormLabel>Date de naissance</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                             <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                               {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Choisir une date</span>
                              )}
                               <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                             </Button>
                           </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                     <FormMessage />
                   </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birth_place"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="bond_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Type de caution</FormLabel>
                     <FormControl>
                       <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                         <FormItem className="flex items-center space-x-3 space-y-0">
                           <FormControl>
                             <RadioGroupItem value="solidary" />
                           </FormControl>
                           <FormLabel className="font-normal">
                            Solidaire
                           </FormLabel>
                         </FormItem>
                         <FormItem className="flex items-center space-x-3 space-y-0">
                           <FormControl>
                             <RadioGroupItem value="simple" />
                           </FormControl>
                           <FormLabel className="font-normal">Simple</FormLabel>
                         </FormItem>
                       </RadioGroup>
                     </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="duration_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Durée de l'engagement</FormLabel>
                     <FormControl>
                       <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                         <FormItem className="flex items-center space-x-3 space-y-0">
                           <FormControl>
                             <RadioGroupItem value="undetermined" />
                           </FormControl>
                           <FormLabel className="font-normal">
                            Indéterminée
                           </FormLabel>
                         </FormItem>
                         <FormItem className="flex items-center space-x-3 space-y-0">
                           <FormControl>
                             <RadioGroupItem value="determined" />
                           </FormControl>
                           <FormLabel className="font-normal">
                            Déterminée
                           </FormLabel>
                         </FormItem>
                       </RadioGroup>
                     </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {durationType === "determined" && (
                 <FormField
                control={form.control}
                name="duration_end_date"
                render={({ field }) => (
                   <FormItem className="flex flex-col">
                     <FormLabel>Date de fin de l'engagement</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                             <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                               {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Choisir une date de fin</span>
                              )}
                               <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                             </Button>
                           </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                     <FormMessage />
                   </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "Génération en cours..." : "Générer le PDF"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
