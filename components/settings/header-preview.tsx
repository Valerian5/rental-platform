"use client"

import { Button } from "@/components/ui/button"
import { HomeIcon, UserIcon, MessageSquareIcon, BellIcon, MenuIcon } from "lucide-react"

interface HeaderPreviewProps {
  type: "standard" | "centered" | "minimal"
}

export function HeaderPreview({ type }: HeaderPreviewProps) {
  return (
    <div className="border rounded-md overflow-hidden mt-4">
      {type === "standard" && (
        <div className="bg-white p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-md"></div>
              <span className="font-bold text-lg">ImmoConnect</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Button variant="ghost" size="sm">
                Accueil
              </Button>
              <Button variant="ghost" size="sm">
                Propriétés
              </Button>
              <Button variant="ghost" size="sm">
                Baux
              </Button>
              <Button variant="ghost" size="sm">
                Visites
              </Button>
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <BellIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageSquareIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <UserIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {type === "centered" && (
        <div className="bg-white p-4 border-b">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-primary rounded-md"></div>
              <span className="font-bold text-xl">ImmoConnect</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Button variant="ghost" size="sm">
                Accueil
              </Button>
              <Button variant="ghost" size="sm">
                Propriétés
              </Button>
              <Button variant="ghost" size="sm">
                Baux
              </Button>
              <Button variant="ghost" size="sm">
                Visites
              </Button>
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <BellIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <UserIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {type === "minimal" && (
        <div className="bg-white p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-md"></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <HomeIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageSquareIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <BellIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <UserIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-50 h-20 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Aperçu du contenu de la page</p>
      </div>
    </div>
  )
}
