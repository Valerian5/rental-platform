"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  Columns, 
  Grid, 
  Layout, 
  Smartphone, 
  Tablet, 
  Monitor,
  Plus,
  Minus,
  RotateCcw
} from "lucide-react"

interface LayoutControlsProps {
  columns: number
  gap: string
  padding: string
  margin: string
  maxWidth: string
  alignment: "left" | "center" | "right" | "stretch"
  responsive: {
    mobile: { columns: number; gap: string }
    tablet: { columns: number; gap: string }
    desktop: { columns: number; gap: string }
  }
  onChange: (updates: any) => void
}

export function LayoutControls({
  columns,
  gap,
  padding,
  margin,
  maxWidth,
  alignment,
  responsive,
  onChange
}: LayoutControlsProps) {
  const columnTemplates = [
    { value: 1, label: "1 colonne", icon: Layout },
    { value: 2, label: "2 colonnes", icon: Columns },
    { value: 3, label: "3 colonnes", icon: Grid },
    { value: 4, label: "4 colonnes", icon: Grid },
  ]

  const alignmentOptions = [
    { value: "left", label: "Gauche" },
    { value: "center", label: "Centre" },
    { value: "right", label: "Droite" },
    { value: "stretch", label: "Étirer" },
  ]

  const spacingPresets = [
    { label: "Aucun", value: "0" },
    { label: "Petit", value: "0.5rem" },
    { label: "Moyen", value: "1rem" },
    { label: "Grand", value: "2rem" },
    { label: "Très grand", value: "4rem" },
  ]

  const widthPresets = [
    { label: "Contenu", value: "max-content" },
    { label: "Petit", value: "320px" },
    { label: "Moyen", value: "768px" },
    { label: "Grand", value: "1024px" },
    { label: "Très grand", value: "1280px" },
    { label: "Plein écran", value: "100%" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Contrôles de mise en page
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Colonnes */}
        <div>
          <label className="text-sm font-medium mb-2 block">Colonnes</label>
          <div className="grid grid-cols-2 gap-2">
            {columnTemplates.map((template) => (
              <Button
                key={template.value}
                variant={columns === template.value ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ columns: template.value })}
                className="justify-start"
              >
                <template.icon className="h-4 w-4 mr-2" />
                {template.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Espacement */}
        <div>
          <label className="text-sm font-medium mb-2 block">Espacement</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Espace entre colonnes</label>
              <div className="flex gap-2">
                <Select value={gap} onValueChange={(value) => onChange({ gap: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {spacingPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={gap}
                  onChange={(e) => onChange({ gap: e.target.value })}
                  placeholder="ex: 1rem"
                  className="w-20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Padding</label>
                <Input
                  value={padding}
                  onChange={(e) => onChange({ padding: e.target.value })}
                  placeholder="ex: 1rem"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Margin</label>
                <Input
                  value={margin}
                  onChange={(e) => onChange({ margin: e.target.value })}
                  placeholder="ex: 2rem auto"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Largeur et alignement */}
        <div>
          <label className="text-sm font-medium mb-2 block">Largeur et alignement</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Largeur maximale</label>
              <div className="flex gap-2">
                <Select value={maxWidth} onValueChange={(value) => onChange({ maxWidth: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {widthPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={maxWidth}
                  onChange={(e) => onChange({ maxWidth: e.target.value })}
                  placeholder="ex: 1200px"
                  className="w-24"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Alignement</label>
              <Select value={alignment} onValueChange={(value) => onChange({ alignment: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alignmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Responsive */}
        <div>
          <label className="text-sm font-medium mb-2 block">Responsive</label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Mobile</span>
              <div className="flex gap-1 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChange({
                    responsive: {
                      ...responsive,
                      mobile: { ...responsive.mobile, columns: Math.max(1, responsive.mobile.columns - 1) }
                    }
                  })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs w-6 text-center">{responsive.mobile.columns}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChange({
                    responsive: {
                      ...responsive,
                      mobile: { ...responsive.mobile, columns: Math.min(4, responsive.mobile.columns + 1) }
                    }
                  })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Tablet</span>
              <div className="flex gap-1 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChange({
                    responsive: {
                      ...responsive,
                      tablet: { ...responsive.tablet, columns: Math.max(1, responsive.tablet.columns - 1) }
                    }
                  })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs w-6 text-center">{responsive.tablet.columns}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChange({
                    responsive: {
                      ...responsive,
                      tablet: { ...responsive.tablet, columns: Math.min(4, responsive.tablet.columns + 1) }
                    }
                  })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Desktop</span>
              <div className="flex gap-1 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChange({
                    responsive: {
                      ...responsive,
                      desktop: { ...responsive.desktop, columns: Math.max(1, responsive.desktop.columns - 1) }
                    }
                  })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs w-6 text-center">{responsive.desktop.columns}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChange({
                    responsive: {
                      ...responsive,
                      desktop: { ...responsive.desktop, columns: Math.min(4, responsive.desktop.columns + 1) }
                    }
                  })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions rapides */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({
              columns: 1,
              gap: "1rem",
              padding: "1rem",
              margin: "0",
              maxWidth: "100%",
              alignment: "left",
              responsive: {
                mobile: { columns: 1, gap: "0.5rem" },
                tablet: { columns: 2, gap: "1rem" },
                desktop: { columns: 3, gap: "1.5rem" }
              }
            })}
            className="flex-1"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
