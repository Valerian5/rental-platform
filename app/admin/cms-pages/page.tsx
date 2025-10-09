"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Search,
  FileText,
  Calendar,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface CmsPage {
  id: string
  slug: string
  title: string
  description?: string
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

export default function CmsPagesList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<CmsPage[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    ;(async () => {
      const user = await authService.getCurrentUser()
      if (!user) return router.push("/login")
      if (user.user_type !== "admin") return router.push("/admin")
      
      await loadPages()
    })()
  }, [router])

  const loadPages = async () => {
    try {
      const res = await fetch("/api/admin/cms-pages", {
        headers: { authorization: `Bearer ${await authService.getAuthToken()}` }
      })
      const json = await res.json()
      if (json.success) {
        setPages(json.data)
      } else {
        toast.error("Erreur lors du chargement des pages")
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des pages")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette page ?")) return
    
    try {
      const res = await fetch(`/api/admin/cms-pages?id=${id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${await authService.getAuthToken()}` }
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Page supprimée")
        await loadPages()
      } else {
        toast.error(json.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleToggleStatus = async (page: CmsPage) => {
    try {
      const newStatus = page.status === "draft" ? "published" : "draft"
      const res = await fetch("/api/admin/cms-pages", {
        method: "PUT",
        headers: { 
          "content-type": "application/json",
          authorization: `Bearer ${await authService.getAuthToken()}` 
        },
        body: JSON.stringify({ ...page, status: newStatus })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Page ${newStatus === "published" ? "publiée" : "mise en brouillon"}`)
        await loadPages()
      } else {
        toast.error(json.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement des pages...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pages CMS</h1>
          <p className="text-muted-foreground">Gérez vos pages de contenu</p>
        </div>
        <Button onClick={() => router.push("/admin/page-builder")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle page
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredPages.length} page{filteredPages.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map((page) => (
          <Card key={page.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{page.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={page.status === "published" ? "default" : "secondary"}>
                      {page.status === "published" ? "Publiée" : "Brouillon"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      /{page.slug}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {page.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {page.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Modifiée le {new Date(page.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/admin/page-builder?id=${page.id}`)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Éditer
                </Button>
                
                {page.status === "published" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/${page.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(page)}
                >
                  {page.status === "published" ? "Dépublier" : "Publier"}
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(page.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune page trouvée</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Aucune page ne correspond à votre recherche." : "Commencez par créer votre première page."}
          </p>
          {!searchTerm && (
            <Button onClick={() => router.push("/admin/page-builder")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une page
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
