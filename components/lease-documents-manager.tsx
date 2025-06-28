"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertTriangle, X, Eye, FileCheck, Shield, Home, Zap } from "lucide-react"
import { toast } from "sonner"

interface LeaseDocumentsManagerProps {
  formData: any
  onDocumentsChange: (documents: File[]) => void
  onAnnexesChange: (annexes: Record<string, boolean>) => void
}

interface DocumentInfo {
  id: string
  name: string
  size: number
  type: string
  file: File
  category: "required" | "optional" | "custom"
  detectedType?: string
}

const REQUIRED_DOCUMENTS = [
  {
    key: "annexe_dpe",
    name: "Diagnostic de Performance Énergétique (DPE)",
    description: "Obligatoire pour tous les logements",
    icon: Home,
    keywords: ["dpe", "diagnostic", "performance", "energetique", "energie"],
  },
  {
    key: "annexe_risques",
    name: "État des Risques Naturels et Technologiques",
    description: "Obligatoire selon la zone géographique",
    icon: AlertTriangle,
    keywords: ["risque", "naturel", "technologique", "ernt", "ernmt"],
  },
  {
    key: "annexe_notice",
    name: "Notice d'Information",
    description: "Notice relative aux droits et obligations",
    icon: FileText,
    keywords: ["notice", "information", "droits", "obligations"],
  },
]

const OPTIONAL_DOCUMENTS = [
  {
    key: "annexe_plomb",
    name: "Constat de Risque d'Exposition au Plomb",
    description: "Pour les immeubles construits avant 1949",
    icon: Shield,
    keywords: ["plomb", "crep", "exposition"],
  },
  {
    key: "annexe_amiante",
    name: "État Amiante",
    description: "Pour certains immeubles",
    icon: Shield,
    keywords: ["amiante", "etat"],
  },
  {
    key: "annexe_electricite_gaz",
    name: "État Installation Électricité et Gaz",
    description: "Installations de plus de 15 ans",
    icon: Zap,
    keywords: ["electricite", "gaz", "installation", "electrique"],
  },
  {
    key: "annexe_reglement",
    name: "Règlement de Copropriété",
    description: "Si applicable",
    icon: FileText,
    keywords: ["reglement", "copropriete"],
  },
  {
    key: "annexe_etat_lieux",
    name: "État des Lieux",
    description: "Sera établi lors de la remise des clés",
    icon: FileCheck,
    keywords: ["etat", "lieux"],
  },
]

export function LeaseDocumentsManager({ formData, onDocumentsChange, onAnnexesChange }: LeaseDocumentsManagerProps) {
  const [mounted, setMounted] = useState(false)
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [uploading, setUploading] = useState(false)

  // État des annexes initialisé de manière sûre
  const [annexes, setAnnexes] = useState<Record<string, boolean>>({})

  // Initialisation côté client uniquement pour éviter les problèmes d'hydratation
  useEffect(() => {
    setMounted(true)
    setAnnexes({
      annexe_dpe: formData?.annexe_dpe || false,
      annexe_risques: formData?.annexe_risques || false,
      annexe_notice: formData?.annexe_notice || false,
      annexe_plomb: formData?.annexe_plomb || false,
      annexe_amiante: formData?.annexe_amiante || false,
      annexe_electricite_gaz: formData?.annexe_electricite_gaz || false,
      annexe_reglement: formData?.annexe_reglement || false,
      annexe_etat_lieux: formData?.annexe_etat_lieux || false,
    })
  }, [formData])

  // Détecter le type de document basé sur le nom du fichier
  const detectDocumentType = useCallback((fileName: string): string | null => {
    if (!fileName) return null

    const name = fileName.toLowerCase()

    for (const doc of [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS]) {
      for (const keyword of doc.keywords) {
        if (name.includes(keyword)) {
          return doc.key
        }
      }
    }

    return null
  }, [])

  // Calculer les statistiques des documents de manière sûre
  const getDocumentStats = useCallback(() => {
    if (!mounted) {
      return {
        requiredCount: 0,
        totalRequired: REQUIRED_DOCUMENTS.length,
        optionalCount: 0,
        totalOptional: OPTIONAL_DOCUMENTS.length,
        completionPercentage: 0,
        totalDocuments: 0,
      }
    }

    const requiredCount = REQUIRED_DOCUMENTS.filter((doc) => annexes[doc.key]).length
    const totalRequired = REQUIRED_DOCUMENTS.length
    const optionalCount = OPTIONAL_DOCUMENTS.filter((doc) => annexes[doc.key]).length
    const totalOptional = OPTIONAL_DOCUMENTS.length

    const completionPercentage = totalRequired > 0 ? Math.round((requiredCount / totalRequired) * 100) : 100

    return {
      requiredCount,
      totalRequired,
      optionalCount,
      totalOptional,
      completionPercentage,
      totalDocuments: documents.length,
    }
  }, [mounted, annexes, documents.length])

  // Formater la taille du fichier
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }, [])

  // Gérer l'upload de fichiers
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) return

      setUploading(true)

      try {
        const newDocuments: DocumentInfo[] = []

        for (const file of files) {
          console.log("📄 [UPLOAD] Traitement fichier:", {
            name: file.name,
            size: file.size,
            type: file.type,
          })

          const detectedType = detectDocumentType(file.name)
          console.log("🔍 [UPLOAD] Type détecté:", detectedType)

          const docInfo: DocumentInfo = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
            category: detectedType
              ? REQUIRED_DOCUMENTS.find((d) => d.key === detectedType)
                ? "required"
                : "optional"
              : "custom",
            detectedType: detectedType || undefined,
          }

          newDocuments.push(docInfo)

          // Marquer automatiquement l'annexe comme présente si détectée
          if (detectedType) {
            setAnnexes((prev) => {
              const updated = { ...prev, [detectedType]: true }
              console.log("✅ [UPLOAD] Annexe marquée:", detectedType, "->", true)
              return updated
            })
          }
        }

        const updatedDocuments = [...documents, ...newDocuments]
        setDocuments(updatedDocuments)

        // Notifier le parent
        onDocumentsChange(updatedDocuments.map((d) => d.file))

        console.log("✅ [UPLOAD] Documents ajoutés:", {
          nouveaux: newDocuments.length,
          total: updatedDocuments.length,
        })

        toast.success(`${newDocuments.length} document(s) ajouté(s)`)
      } catch (error) {
        console.error("❌ [UPLOAD] Erreur:", error)
        toast.error("Erreur lors de l'upload des documents")
      } finally {
        setUploading(false)
        // Reset input
        if (event.target) {
          event.target.value = ""
        }
      }
    },
    [documents, detectDocumentType, onDocumentsChange],
  )

  // Supprimer un document
  const removeDocument = useCallback(
    (documentId: string) => {
      const docToRemove = documents.find((d) => d.id === documentId)
      if (!docToRemove) return

      const updatedDocuments = documents.filter((d) => d.id !== documentId)

      // Si c'était un document détecté automatiquement, décocher l'annexe
      if (docToRemove.detectedType) {
        // Vérifier s'il reste d'autres documents du même type
        const hasOtherOfSameType = updatedDocuments.some((d) => d.detectedType === docToRemove.detectedType)
        if (!hasOtherOfSameType) {
          setAnnexes((prev) => ({
            ...prev,
            [docToRemove.detectedType!]: false,
          }))
        }
      }

      setDocuments(updatedDocuments)
      onDocumentsChange(updatedDocuments.map((d) => d.file))
      toast.success("Document supprimé")
    },
    [documents, onDocumentsChange],
  )

  // Gérer les changements d'annexes manuels
  const handleAnnexeChange = useCallback(
    (key: string, checked: boolean) => {
      const updated = { ...annexes, [key]: checked }
      setAnnexes(updated)
      onAnnexesChange(updated)
    },
    [annexes, onAnnexesChange],
  )

  // Synchroniser les annexes avec le parent
  useEffect(() => {
    if (mounted) {
      onAnnexesChange(annexes)
    }
  }, [annexes, onAnnexesChange, mounted])

  // Ne pas rendre le composant tant qu'il n'est pas monté côté client
  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Documents et Annexes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getDocumentStats()

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Documents et Annexes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barre de progression */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Documents obligatoires</span>
                <span>
                  {stats.requiredCount}/{stats.totalRequired}
                </span>
              </div>
              <Progress value={stats.completionPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.completionPercentage}% complété</p>
            </div>

            {/* Résumé */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</div>
                <div className="text-xs text-muted-foreground">Documents uploadés</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{stats.requiredCount}</div>
                <div className="text-xs text-muted-foreground">Obligatoires</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">{stats.optionalCount}</div>
                <div className="text-xs text-muted-foreground">Optionnels</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone d'upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ajouter des documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Glissez vos documents ici ou cliquez pour sélectionner</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG, PNG (max 10MB par fichier)</p>
              </div>
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mt-4"
              />
            </div>

            {uploading && (
              <Alert>
                <Upload className="h-4 w-4" />
                <AlertDescription>Upload en cours...</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents uploadés */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents uploadés ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        {doc.detectedType && (
                          <Badge variant="secondary" className="text-xs">
                            {REQUIRED_DOCUMENTS.find((d) => d.key === doc.detectedType)?.name ||
                              OPTIONAL_DOCUMENTS.find((d) => d.key === doc.detectedType)?.name ||
                              "Détecté"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents obligatoires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Documents obligatoires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {REQUIRED_DOCUMENTS.map((doc) => {
              const Icon = doc.icon
              const isPresent = annexes[doc.key] || false
              return (
                <div key={doc.key} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Icon className={`h-5 w-5 mt-0.5 ${isPresent ? "text-green-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{doc.name}</h4>
                      {isPresent && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                  </div>
                  <Switch checked={isPresent} onCheckedChange={(checked) => handleAnnexeChange(doc.key, checked)} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents optionnels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">Documents optionnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {OPTIONAL_DOCUMENTS.map((doc) => {
              const Icon = doc.icon
              const isPresent = annexes[doc.key] || false
              return (
                <div key={doc.key} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Icon className={`h-5 w-5 mt-0.5 ${isPresent ? "text-green-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{doc.name}</h4>
                      {isPresent && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                  </div>
                  <Switch checked={isPresent} onCheckedChange={(checked) => handleAnnexeChange(doc.key, checked)} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Validation finale */}
      {stats.requiredCount === stats.totalRequired ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>✅ Tous les documents obligatoires sont présents. Le bail peut être créé.</AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Il manque {stats.totalRequired - stats.requiredCount} document(s) obligatoire(s) pour finaliser le bail.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
