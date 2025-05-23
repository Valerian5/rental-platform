import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Upload, CheckCircle, Clock } from "lucide-react"

interface Document {
  id: string
  name: string
  type: string
  url: string
  uploadDate: string
  signed: boolean
}

interface LeaseDocumentsProps {
  documents: Document[]
}

const documentTypeConfig = {
  lease: { label: "Contrat de bail", icon: FileText },
  inventory: { label: "État des lieux", icon: FileText },
  insurance: { label: "Assurance", icon: FileText },
  guarantee: { label: "Caution", icon: FileText },
  amendment: { label: "Avenant", icon: FileText },
}

export function LeaseDocuments({ documents }: LeaseDocumentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents du Bail
        </CardTitle>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((document) => {
            const typeConfig = documentTypeConfig[document.type as keyof typeof documentTypeConfig] || {
              label: document.type,
              icon: FileText,
            }
            const Icon = typeConfig.icon

            return (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{document.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{typeConfig.label}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(document.uploadDate).toLocaleDateString("fr-FR")}
                      </span>
                      {document.signed ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Signé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
