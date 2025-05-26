"use client"

// Script pour identifier tous les fichiers utilisant sonner
// Fichiers à vérifier et corriger :

// 1. app/register/page.tsx
// 2. app/owner/register/page.tsx
// 3. app/tenant/register/page.tsx
// 4. app/owner/properties/new/page.tsx
// 5. app/properties/[id]/apply/page.tsx
// 6. Tous les autres fichiers avec toast

// Remplacer partout :
// import { toast } from "sonner"
// par
// import { useToast } from "@/hooks/use-toast"

// Et ajouter dans le composant :
// const { toast } = useToast()

// Puis remplacer les appels :
// toast.success("message") -> toast({ title: "Succès", description: "message" })
// toast.error("message") -> toast({ title: "Erreur", description: "message", variant: "destructive" })
// toast.info("message") -> toast({ title: "Info", description: "message" })
