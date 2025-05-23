"use client"

import { useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color)

  const handleColorChange = (newColor: string) => {
    setCurrentColor(newColor)
    onChange(newColor)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full h-10 p-1 border-input" style={{ justifyContent: "flex-start" }}>
            <div className="h-full aspect-square rounded-sm mr-2" style={{ backgroundColor: currentColor }} />
            <span>{currentColor}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <HexColorPicker color={currentColor} onChange={handleColorChange} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
