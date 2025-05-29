"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, File, Check, AlertCircle, Download, Eye } from "lucide-react"
import { rentalFileService, RENTAL_FILE_ITEMS } from "@/lib/rental-file-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function RentalFilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rentalFile, setRentalFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user && user.user_type === "tenant") {
          setCurrentUser(user)
          const fileData = await rentalFileService.getRentalFile(user.id)
          setRentalFile(fileData)
        }
      } catch (error) {
        console.error("Erreur chargement dossier:", error)
        toast.error("Erreur lors du chargement du dossier")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFileUpload = async (itemKey: string, files: FileList | null) => {
    if (!files || !currentUser) return

    setUploadingItem(itemKey)

    try {
      // Simuler l'upload - à remplacer par un vrai service d'upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const fileUrls = Array.from(files).map((file) => URL.createObjectURL(file))

      const item = RENTAL_FILE_ITEMS.find((i) => i.key === itemKey)
      const updateData = {
        ...rentalFile,
        [itemKey]: item?.type === "multiple" ? fileUrls : fileUrls[0],
      }

      const updatedFile = await rentalFileService.updateRentalFile(currentUser.id, updateData)
      setRentalFile(updatedFile)

      toast.success(`${item?.name} mis à jour avec succès`)
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du fichier")
    } finally {
      setUploadingItem(null)
    }
  }

  const getItemStatus = (itemKey: string) => {
    if (!rentalFile) return "missing"

    const value = rentalFile[itemKey]
    if (!value) return "missing"

    const item = RENTAL_FILE_ITEMS.find((i) => i.key === itemKey)
    if (item?.type === "multiple") {
      return Array.isArray(value) && value.length > 0 ? "uploaded" : "missing"
    }
    return typeof value === "string" && value.trim() !== "" ? "uploaded" : "missing"
  }

  const completionPercentage = rentalFile?.completion_percentage || 0
  const missingDocuments = rentalFileService.getMissingDocuments(rentalFile)

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de votre dossier...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.user_type !== "tenant") {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600">Accès non autorisé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon dossier de location</h1>
          <p className="text-gray-600">Complétez votre dossier pour optimiser vos chances d'obtenir un logement</p>
        </div>

        {/* Progression */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Progression du dossier</h3>
              <Badge variant={completionPercentage >= 80 ? "default" : "secondary"}>
                {completionPercentage}% complété
              </Badge>
            </div>
            <Progress value={completionPercentage} className="h-3 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Documents requis</p>
                <p className="font-medium">
                  {RENTAL_FILE_ITEMS.filter((item) => item.required).length - missingDocuments.length} /{" "}
                  {RENTAL_FILE_ITEMS.filter((item) => item.required).length}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Dernière mise à jour</p>
                <p className="font-medium">
                  {rentalFile?.updated_at ? new Date(rentalFile.updated_at).toLocaleDateString("fr-FR") : "Jamais"}
                </p>
              </div>
            </div>

            {missingDocuments.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-orange-600 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 mb-1">Documents manquants :</p>
                    <ul className="text-orange-700 space-y-1">
                      {missingDocuments.map((doc, index) => (
                        <li key={index}>• {doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {RENTAL_FILE_ITEMS.map((item) => {
            const status = getItemStatus(item.key)
            const isUploading = uploadingItem === item.key
            const files = rentalFile?.[item.key]

            return (
              <Card key={item.key} className={`${!item.required ? "border-dashed" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center">
                        {item.name}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                        {status === "uploaded" && <Check className="h-4 w-4 text-green-600 ml-2" />}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    <Badge variant={item.required ? "default" : "secondary"} className="ml-2">
                      {item.required ? "Requis" : "Optionnel"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Affichage des fichiers uploadés */}
                    {files && (
                      <div className="space-y-2">
                        {item.type === "multiple" && Array.isArray(files) ? (
                          files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
                            >
                              <div className="flex items-center">
                                <File className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm text-green-800">Document {index + 1}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : typeof files === "string" && files ? (
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center">
                              <File className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-sm text-green-800">Document uploadé</span>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Zone d'upload */}
                    <div className="relative">
                      <input
                        type="file"
                        multiple={item.type === "multiple"}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(item.key, e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                          isUploading ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {isUploading ? (
                          <div className="space-y-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-blue-600">Upload en cours...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">
                              {status === "uploaded" ? "Remplacer le document" : "Cliquer pour ajouter"}
                            </p>
                            <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Télécharger mon dossier</h3>
                <p className="text-sm text-gray-600">Générez un PDF avec tous vos documents pour les propriétaires</p>
              </div>
              <Button variant="outline" disabled={completionPercentage < 50}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
