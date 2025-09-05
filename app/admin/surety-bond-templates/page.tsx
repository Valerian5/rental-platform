import SuretyBondTemplateManager from "@/components/admin/SuretyBondTemplateManager"

export default function SuretyBondTemplatesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Modèles d'Acte de Cautionnement
      </h1>
      <SuretyBondTemplateManager />
    </div>
  )
}
