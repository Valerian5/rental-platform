"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Clock, FileText, ArrowRight, X, CheckCircle, Calendar } from "lucide-react"
import { documentObsolescenceService, type ObsoleteDocument } from "@/lib/document-obsolescence-service"
import { useRouter } from "next/navigation"

interface DocumentUpdatePopupProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function DocumentUpdatePopup({ userId, isOpen, onClose }: DocumentUpdatePopupProps) {
  const [obsoleteDocuments, setObsoleteDocuments] = useState<ObsoleteDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<ObsoleteDocument | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && userId) {
      checkObsoleteDocuments()
    }
  }, [isOpen, userId])

  const checkObsoleteDocuments = async () => {
    try {
      setLoading(true)
      const documents = await documentObsolescenceService.checkUserDocuments(userId)
      setObsoleteDocuments(documents)
    } catch (error) {
      console.error("❌ Erreur vérification documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDocument = (document: ObsoleteDocument) => {
    // Fermer le popup
    onClose()

    // Naviguer vers la page de mise à jour avec les paramètres appropriés
    const updateUrl = `/tenant/profile/rental-file?update=${document.documentType}&person=${encodeURIComponent(document.personType)}&category=${document.category}`
    router.push(updateUrl)
  }

  const handleDismissDocument = async (document: ObsoleteDocument) => {
    // Retirer le document de la liste (temporairement)
    setObsoleteDocuments((prev) =>
      prev.filter((doc) => doc.documentType !== document.documentType || doc.personType !== document.personType),
    )
  }

  const getUrgencyStats = () => {
    const high = obsoleteDocuments.filter((doc) => doc.urgency === "high").length
    const medium = obsoleteDocuments.filter((doc) => doc.urgency === "medium").length
    const low = obsoleteDocuments.filter((doc) => doc.urgency === "low").length
    return { high, medium, low }
  }

  if (!isOpen) return null

  const urgencyStats = getUrgencyStats()
  const hasDocuments = obsoleteDocuments.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Mise à jour de votre dossier de location
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Vérification de vos documents...</span>
          </div>
        ) : !hasDocuments ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Votre dossier est à jour !</h3>
            <p className="text-green-600 mb-4">Tous vos documents sont récents et conformes.</p>
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résumé des urgences */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    <strong>{obsoleteDocuments.length} document(s)</strong> nécessitent une mise à jour
                  </span>
                  <div className="flex gap-2">
                    {urgencyStats.high > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {urgencyStats.high} urgent(s)
                      </Badge>
                    )}
                    {urgencyStats.medium > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {urgencyStats.medium} important(s)
                      </Badge>
                    )}
                    {urgencyStats.low > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {urgencyStats.low} recommandé(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Liste des documents obsolètes */}
            <div className="space-y-4">
              <h3 className="font-medium">Documents à mettre à jour :</h3>

              {obsoleteDocuments.map((document, index) => (
                <Card key={index} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span>{documentObsolescenceService.getCategoryIcon(document.category)}</span>
                          {document.documentName}
                          <Badge variant={documentObsolescenceService.getUrgencyBadge(document.urgency) as any}>
                            {document.urgency === "high"
                              ? "Urgent"
                              : document.urgency === "medium"
                                ? "Important"
                                : "Recommandé"}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{document.personType}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissDocument(document)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-800 mb-1">Problème détecté :</p>
                        <p className="text-sm text-gray-600">{document.reason}</p>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">Action recommandée :</p>
                        <p className="text-sm text-blue-700">{document.recommendedAction}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateDocument(document)}
                          className="flex-1"
                          variant={document.urgency === "high" ? "default" : "outline"}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Mettre à jour maintenant
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>

                        {document.urgency !== "high" && (
                          <Button variant="ghost" onClick={() => handleDismissDocument(document)} className="px-3">
                            Plus tard
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions globales */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                <Calendar className="h-4 w-4 inline mr-1" />
                Prochaine vérification dans 7 jours
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    onClose()
                    router.push("/tenant/profile/rental-file")
                  }}
                >
                  Voir mon dossier complet
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
