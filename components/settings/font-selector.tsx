"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FontOption {
  name: string
  value: string
}

interface FontSelectorProps {
  fonts: FontOption[]
  defaultValue: string
}

export function FontSelector({ fonts, defaultValue }: FontSelectorProps) {
  return (
    <Select defaultValue={defaultValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sélectionnez une police" />
      </SelectTrigger>
      <SelectContent>
        {fonts.map((font) => (
          <SelectItem key={font.value} value={font.value}>
            <span style={{ fontFamily: font.value }}>{font.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
