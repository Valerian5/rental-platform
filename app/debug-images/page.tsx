"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { propertyService } from "@/lib/property-service"
import { imageService } from "@/lib/image-service"
import { authService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase"

export default function DebugImagesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [storageFiles, setStorageFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const user = await authService.getCurrentUser()
        if (!user) return

        // Récupérer les propriétés
        const props = await propertyService.getOwnerProperties(user.id)
        setProperties(props)

        // Récupérer les fichiers du storage
        const { data: files, error } = await supabase.storage.from("property-images").list("", { limit: 100 })

        if (!error && files) {
          setStorageFiles(files)
        }

        console.log("🏠 Propriétés:", props)
        console.log("📁 Fichiers storage:", files)
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const testImageUrl = (url: string) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    })
  }

  const TestImage = ({ url, alt }: { url: string; alt: string }) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)

    return (
      <div className="border rounded p-2">
        <div className="text-xs mb-2 break-all">{url}</div>
        <img
          src={url || "/placeholder.svg"}
          alt={alt}
          className="w-32 h-24 object-cover border"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        <div className="text-xs mt-1">{hasError ? "❌ Erreur" : isLoaded ? "✅ OK" : "⏳ Chargement..."}</div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Images</h1>

      {/* Informations Storage */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Fichiers dans le bucket property-images : {storageFiles.length}</p>
          <div className="mt-4 space-y-2">
            {storageFiles.slice(0, 5).map((file, index) => (
              <div key={index} className="text-sm">
                📁 {file.name} - {file.metadata?.size} bytes
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test des URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Test des URLs d'images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) =>
              property.property_images?.map((image: any, index: number) => (
                <TestImage
                  key={`${property.id}-${index}`}
                  url={image.url}
                  alt={`${property.title} - Image ${index + 1}`}
                />
              )),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Propriétés et leurs images */}
      <Card>
        <CardHeader>
          <CardTitle>Propriétés et images</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.map((property) => (
            <div key={property.id} className="mb-6 p-4 border rounded">
              <h3 className="font-semibold">{property.title}</h3>
              <p className="text-sm text-gray-600">ID: {property.id}</p>
              <p className="text-sm">Images: {property.property_images?.length || 0}</p>

              {property.property_images?.length > 0 && (
                <div className="mt-2 space-y-2">
                  {property.property_images.map((image: any, index: number) => (
                    <div key={index} className="text-xs">
                      <div>URL: {image.url}</div>
                      <div>Primary: {image.is_primary ? "Oui" : "Non"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test manuel d'upload */}
      <Card>
        <CardHeader>
          <CardTitle>Test d'upload</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file || properties.length === 0) return

              try {
                console.log("🔄 Test d'upload...")
                const url = await imageService.uploadPropertyImage(file, properties[0].id)
                console.log("✅ URL générée:", url)

                // Tester l'URL
                const isAccessible = await testImageUrl(url)
                console.log("🔍 URL accessible:", isAccessible)

                alert(`Upload terminé!\nURL: ${url}\nAccessible: ${isAccessible}`)
              } catch (error) {
                console.error("❌ Erreur upload:", error)
                alert(`Erreur: ${error}`)
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
