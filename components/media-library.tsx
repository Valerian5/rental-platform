"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  File, 
  Search,
  X,
  Copy,
  Trash2,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface MediaItem {
  id: string
  type: "image" | "video" | "file"
  url: string
  name: string
  size: number
  alt?: string
  uploadedAt: Date
}

interface MediaLibraryProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: MediaItem) => void
  type?: "image" | "video" | "all"
}

export function MediaLibrary({ isOpen, onClose, onSelect, type = "all" }: MediaLibraryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([
    // Exemples de médias
    {
      id: "1",
      type: "image",
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=300&fit=crop",
      name: "Forêt naturelle",
      size: 1024000,
      alt: "Paysage de forêt avec arbres verts",
      uploadedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      type: "image",
      url: "https://images.unsplash.com/photo-1506905925346-14bda5d4c4ad?w=500&h=300&fit=crop",
      name: "Montagne enneigée",
      size: 2048000,
      alt: "Vue panoramique de montagnes enneigées",
      uploadedAt: new Date("2024-01-14"),
    },
    {
      id: "3",
      type: "video",
      url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
      name: "Vidéo d'exemple",
      size: 1048576,
      uploadedAt: new Date("2024-01-13"),
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video">("all")

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || item.type === selectedType
    const matchesFilter = type === "all" || item.type === type
    return matchesSearch && matchesType && matchesFilter
  })

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        const newItem: MediaItem = {
          id: crypto.randomUUID(),
          type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file",
          url,
          name: file.name,
          size: file.size,
          uploadedAt: new Date(),
        }
        setMediaItems(prev => [newItem, ...prev])
        toast.success(`${file.name} uploadé avec succès`)
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id))
    toast.success("Média supprimé")
  }, [])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copiée dans le presse-papiers")
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bibliothèque de médias</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search and Upload */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des médias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="media-upload">
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Uploader
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Vidéos</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="mt-4">
              <ScrollArea className="h-96">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="group cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-2">
                        <div className="aspect-video bg-muted rounded mb-2 overflow-hidden">
                          {item.type === "image" ? (
                            <img
                              src={item.url}
                              alt={item.alt || item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === "video" ? (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <File className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {item.type === "image" ? (
                              <ImageIcon className="h-3 w-3 text-muted-foreground" />
                            ) : item.type === "video" ? (
                              <Video className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <File className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-xs font-medium truncate">{item.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(item.size)}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => onSelect(item)}
                            >
                              Sélectionner
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => handleCopyUrl(item.url)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
