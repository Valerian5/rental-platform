"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadIcon, TrashIcon } from "lucide-react"

export function LogoUploader() {
  const [logo, setLogo] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.match("image.*")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setLogo(e.target.result as string)
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setLogo(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogo(null)
  }

  return (
    <div className="space-y-4">
      {logo ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 border rounded-md">
            <img src={logo || "/placeholder.svg"} alt="Logo" className="max-h-24 max-w-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={removeLogo}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <Label htmlFor="logo-upload" className="flex-1">
              <div className="flex items-center justify-center w-full">
                <Button variant="outline" className="w-full" type="button">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Changer le logo
                </Button>
              </div>
              <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </Label>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadIcon className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-center text-muted-foreground mb-2">
            Glissez-déposez votre logo ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-center text-muted-foreground">PNG, JPG ou SVG. Taille maximale 2MB.</p>
          <Label htmlFor="logo-upload" className="mt-4">
            <div className="flex items-center justify-center w-full">
              <Button variant="outline" type="button">
                Parcourir
              </Button>
            </div>
            <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </Label>
        </div>
      )}
    </div>
  )
}
