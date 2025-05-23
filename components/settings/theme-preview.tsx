"use client"

export function ThemePreview() {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="p-4 bg-primary text-primary-foreground">
        <h3 className="font-medium">Couleur principale</h3>
        <p className="text-sm opacity-90">Utilisée pour les éléments principaux</p>
      </div>
      <div className="p-4 bg-secondary text-secondary-foreground">
        <h3 className="font-medium">Couleur secondaire</h3>
        <p className="text-sm opacity-90">Utilisée pour les éléments secondaires</p>
      </div>
      <div className="p-4 bg-white border-t">
        <div className="space-y-2">
          <div className="h-8 w-full bg-primary rounded-md"></div>
          <div className="h-8 w-full bg-secondary rounded-md"></div>
          <div className="h-8 w-full bg-orange-500 rounded-md"></div>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t">
        <p className="text-sm text-center text-muted-foreground">Aperçu des couleurs du thème</p>
      </div>
    </div>
  )
}
