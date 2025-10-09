"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Type, 
  Image, 
  Video, 
  Square, 
  Columns, 
  Palette, 
  Settings, 
  Eye, 
  Save, 
  Upload,
  Copy,
  Trash2,
  Move,
  Plus,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  Quote,
  X,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/rich-text-editor"
import { MediaLibrary } from "@/components/media-library"
import { LayoutControls } from "@/components/layout-controls"
import { blockTemplates, pageTemplates, createBlockFromTemplate, createPageFromTemplate } from "@/lib/page-templates"

type BlockType =
  | { id: string; type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string; style?: any }
  | { id: string; type: "paragraph"; html: string; style?: any }
  | { id: string; type: "image"; url: string; alt?: string; style?: any }
  | { id: string; type: "video"; url: string; provider?: "youtube" | "vimeo" | "file"; style?: any }
  | { id: string; type: "button"; label: string; href: string; style?: any }
  | { id: string; type: "section"; columns: BlockType[][]; style?: any; layout?: any }

interface CmsPageDraft {
  id?: string
  slug: string
  title: string
  description?: string
  blocks: BlockType[]
  seo: any
  status: "draft" | "published"
}

function PageBuilder() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [page, setPage] = useState<CmsPageDraft>({ slug: "", title: "", description: "", blocks: [], seo: {}, status: "draft" })
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null)
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const [mediaLibraryType, setMediaLibraryType] = useState<"image" | "video" | "all">("all")

  useEffect(() => {
    ;(async () => {
      const user = await authService.getCurrentUser()
      if (!user) return router.push("/login")
      if (user.user_type !== "admin") return router.push("/")
      setLoading(false)
    })()
  }, [router])

  const seoScore = useMemo(() => computeSeoScore(page), [page])

  const addBlock = useCallback((type: BlockType["type"]) => {
    const id = crypto.randomUUID()
    const newBlock: BlockType =
      type === "heading"
        ? { id, type, level: 1, text: "Nouveau titre" }
        : type === "paragraph"
          ? { id, type, html: "<p>Nouveau paragraphe</p>" }
          : type === "image"
            ? { id, type, url: "", alt: "" }
            : type === "video"
              ? { id, type, url: "" }
              : type === "button"
                ? { id, type, label: "Nouveau bouton", href: "#" }
                : { id, type: "section", columns: [[]] }
    setPage((p) => ({ ...p, blocks: [...p.blocks, newBlock] }))
    setSelectedBlockId(id)
  }, [])

  const onDragStart = (index: number) => setDragIndex(index)
  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return
    setPage((p) => {
      const next = [...p.blocks]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return { ...p, blocks: next }
    })
    setDragIndex(null)
  }

  const duplicateBlock = useCallback((block: BlockType) => {
    const newBlock = { ...block, id: crypto.randomUUID() }
    setPage((p) => {
      const index = p.blocks.findIndex(b => b.id === block.id)
      const newBlocks = [...p.blocks]
      newBlocks.splice(index + 1, 0, newBlock)
      return { ...p, blocks: newBlocks }
    })
    setSelectedBlockId(newBlock.id)
  }, [])

  const save = async (publish = false) => {
    try {
      setSaving(true)
      const payload = { ...page, status: publish ? "published" : page.status }
      const method = page.id ? "PUT" : "POST"
      const res = await fetch("/api/admin/cms-pages", {
        method,
        headers: { "content-type": "application/json", authorization: await authService.getAuthHeader() },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur sauvegarde")
      setPage(json.data)
      toast.success(publish ? "Page publiée" : "Brouillon sauvegardé")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Chargement…</div>

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="h-16 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Page Builder</h1>
          <Badge variant={page.status === "published" ? "default" : "secondary"}>
            {page.status === "published" ? "Publié" : "Brouillon"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {isPreview ? "Éditer" : "Aperçu"}
          </Button>
          <Button onClick={() => save(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button onClick={() => save(true)} disabled={saving} variant="default">
            Publier
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Blocks Library */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-medium mb-3">Blocs</h2>
            <div className="grid grid-cols-2 gap-2">
              <BlockButton icon={Type} label="Titre" onClick={() => addBlock("heading")} />
              <BlockButton icon={Square} label="Texte" onClick={() => addBlock("paragraph")} />
              <BlockButton icon={Image} label="Image" onClick={() => addBlock("image")} />
              <BlockButton icon={Video} label="Vidéo" onClick={() => addBlock("video")} />
              <BlockButton icon={Square} label="Bouton" onClick={() => addBlock("button")} />
              <BlockButton icon={Columns} label="Section" onClick={() => addBlock("section")} />
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <Tabs defaultValue="blocks" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="blocks">Blocs</TabsTrigger>
                <TabsTrigger value="templates">Modèles</TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Blocs de base</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <BlockButton icon={Type} label="Titre" onClick={() => addBlock("heading")} />
                    <BlockButton icon={Square} label="Texte" onClick={() => addBlock("paragraph")} />
                    <BlockButton icon={Image} label="Image" onClick={() => addBlock("image")} />
                    <BlockButton icon={Video} label="Vidéo" onClick={() => addBlock("video")} />
                    <BlockButton icon={Square} label="Bouton" onClick={() => addBlock("button")} />
                    <BlockButton icon={Columns} label="Section" onClick={() => addBlock("section")} />
                  </div>
                  
                  <Separator />
                  
                  <h3 className="text-sm font-medium text-muted-foreground">Modèles de blocs</h3>
                  <div className="space-y-2">
                    {blockTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border rounded cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          const newBlock = createBlockFromTemplate(template)
                          setPage((p) => ({ ...p, blocks: [...p.blocks, newBlock] }))
                          setSelectedBlockId(newBlock.id)
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            {template.category === "text" && <Type className="h-4 w-4" />}
                            {template.category === "media" && <Image className="h-4 w-4" />}
                            {template.category === "layout" && <Columns className="h-4 w-4" />}
                            {template.category === "interactive" && <Square className="h-4 w-4" />}
                          </div>
                          <div className="font-medium text-sm">{template.name}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="templates" className="mt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Modèles de page</h3>
                  <div className="space-y-2">
                    {pageTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border rounded cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          const newBlocks = createPageFromTemplate(template)
                          setPage((p) => ({ ...p, blocks: [...p.blocks, ...newBlocks] }))
                          toast.success(`Modèle "${template.name}" ajouté`)
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            {template.category === "landing" && <Layout className="h-4 w-4" />}
                            {template.category === "content" && <FileText className="h-4 w-4" />}
                            {template.category === "marketing" && <Square className="h-4 w-4" />}
                            {template.category === "ecommerce" && <Square className="h-4 w-4" />}
                          </div>
                          <div className="font-medium text-sm">{template.name}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {template.blocks.length} bloc{template.blocks.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center gap-4">
              <Input 
                placeholder="Titre de la page" 
                value={page.title} 
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                className="max-w-md"
              />
              <Input 
                placeholder="Slug" 
                value={page.slug} 
                onChange={(e) => setPage({ ...page, slug: e.target.value })}
                className="max-w-xs"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="min-h-full p-8">
              <div className="max-w-4xl mx-auto">
                {isPreview ? (
                  <PreviewRenderer blocks={page.blocks} />
                ) : (
                  <Canvas
                    blocks={page.blocks}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    onUpdateBlock={(block) => setPage((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === block.id ? block : b)) }))}
                    onDeleteBlock={(id) => setPage((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }))}
                    onDuplicateBlock={duplicateBlock}
                    onEditBlock={setEditingBlock}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Inspector */}
        <div className="w-80 border-l bg-card">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div>
                <h2 className="font-medium mb-3">Paramètres de page</h2>
                <div className="space-y-3">
                  <Input placeholder="Meta title" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />
                  <Textarea placeholder="Meta description" value={page.description} onChange={(e) => setPage({ ...page, description: e.target.value })} />
                  <Select onValueChange={(v) => setPage({ ...page, status: v as any })} value={page.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm">
                    SEO: <span className={seoScore.color === "green" ? "text-green-600" : seoScore.color === "orange" ? "text-orange-600" : "text-red-600"}>{seoScore.score}/100</span>
                  </div>
                </div>
              </div>

              <Separator />

              <StyleInspector
                block={page.blocks.find((b) => b.id === selectedBlockId)}
                onChange={(style) =>
                  setPage((p) => ({
                    ...p,
                    blocks: p.blocks.map((b) => (b.id === selectedBlockId ? ({ ...b, style: { ...(b as any).style, ...style } } as any) : b)),
                  }))
                }
              />

              {/* Layout Controls for Sections */}
              {page.blocks.find((b) => b.id === selectedBlockId)?.type === "section" && (
                <LayoutControls
                  columns={(page.blocks.find((b) => b.id === selectedBlockId) as any)?.layout?.columns || 2}
                  gap={(page.blocks.find((b) => b.id === selectedBlockId) as any)?.layout?.gap || "1rem"}
                  padding={(page.blocks.find((b) => b.id === selectedBlockId) as any)?.layout?.padding || "1rem"}
                  margin={(page.blocks.find((b) => b.id === selectedBlockId) as any)?.layout?.margin || "0"}
                  maxWidth={(page.blocks.find((b) => b.id === selectedBlockId) as any)?.layout?.maxWidth || "100%"}
                  alignment={(page.blocks.find((b) => b.id === selectedBlockId) as any)?.layout?.alignment || "left"}
                  responsive={(page.blocks.find((b) => b.id === selectedBlockId) as any)?.layout?.responsive || {
                    mobile: { columns: 1, gap: "0.5rem" },
                    tablet: { columns: 2, gap: "1rem" },
                    desktop: { columns: 3, gap: "1.5rem" }
                  }}
                  onChange={(layout) =>
                    setPage((p) => ({
                      ...p,
                      blocks: p.blocks.map((b) => (b.id === selectedBlockId ? ({ ...b, layout: { ...(b as any).layout, ...layout } } as any) : b)),
                    }))
                  }
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Block Content Editor Modal */}
      {editingBlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Éditer {editingBlock.type === "heading" ? "le titre" : editingBlock.type === "paragraph" ? "le paragraphe" : "le contenu"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingBlock(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <BlockContentEditor
                block={editingBlock}
                onChange={(updatedBlock) => {
                  setPage((p) => ({
                    ...p,
                    blocks: p.blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
                  }))
                  setEditingBlock(updatedBlock)
                }}
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingBlock(null)}>
                Annuler
              </Button>
              <Button onClick={() => setEditingBlock(null)}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library */}
      <MediaLibrary
        isOpen={mediaLibraryOpen}
        onClose={() => setMediaLibraryOpen(false)}
        onSelect={(item) => {
          if (editingBlock) {
            if (editingBlock.type === "image") {
              setEditingBlock({ ...editingBlock, url: item.url, alt: item.alt || "" })
            } else if (editingBlock.type === "video") {
              setEditingBlock({ ...editingBlock, url: item.url })
            }
          }
          setMediaLibraryOpen(false)
        }}
        type={mediaLibraryType}
      />
    </div>
  )
}

function applyStyle(style?: any): React.CSSProperties {
  if (!style) return {}
  const css: React.CSSProperties = {}
  if (style.fontFamily) css.fontFamily = style.fontFamily
  if (style.fontSize) css.fontSize = style.fontSize
  if (style.fontWeight) css.fontWeight = style.fontWeight as any
  if (style.color) css.color = style.color
  if (style.textAlign) css.textAlign = style.textAlign
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor
  if (style.padding) css.padding = style.padding
  if (style.margin) css.margin = style.margin
  if (style.border) css.border = style.border
  if (style.borderRadius) css.borderRadius = style.borderRadius
  if (style.boxShadow) css.boxShadow = style.boxShadow
  return css
}

// Helper Components
function BlockButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={onClick}>
      <Icon className="h-6 w-6" />
      <span className="text-xs">{label}</span>
    </Button>
  )
}

function BlockTemplate({ name, description, onClick }: { name: string; description: string; onClick: () => void }) {
  return (
    <div className="p-3 border rounded cursor-pointer hover:bg-muted" onClick={onClick}>
      <div className="font-medium text-sm">{name}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  )
}

function Canvas({ 
  blocks, 
  selectedBlockId, 
  onSelectBlock, 
  onUpdateBlock, 
  onDeleteBlock, 
  onDuplicateBlock,
  onEditBlock,
  onDragStart,
  onDragOver,
  onDrop
}: {
  blocks: BlockType[]
  selectedBlockId: string | null
  onSelectBlock: (id: string) => void
  onUpdateBlock: (block: BlockType) => void
  onDeleteBlock: (id: string) => void
  onDuplicateBlock: (block: BlockType) => void
  onEditBlock: (block: BlockType) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (index: number) => void
}) {
  return (
    <div className="space-y-4">
      {blocks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-lg font-medium mb-2">Commencez à construire votre page</div>
          <div className="text-sm">Glissez des blocs depuis la barre latérale</div>
        </div>
      ) : (
        blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(index)}
            className={`relative group ${selectedBlockId === block.id ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                  <GripVertical className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => onDuplicateBlock(block)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => onDeleteBlock(block.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <BlockEditor
              block={block}
              onChange={onUpdateBlock}
              onDelete={() => onDeleteBlock(block.id)}
              onSelect={() => onSelectBlock(block.id)}
              onEdit={() => onEditBlock(block)}
              isSelected={selectedBlockId === block.id}
            />
          </div>
        ))
      )}
    </div>
  )
}

function PreviewRenderer({ blocks }: { blocks: BlockType[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-8">
      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.id} style={applyStyle((block as any).style)}>
            {block.type === "heading" && (
              <div className={`font-bold ${block.level === 1 ? 'text-4xl' : block.level === 2 ? 'text-3xl' : block.level === 3 ? 'text-2xl' : 'text-xl'}`}>
                {block.text}
              </div>
            )}
            {block.type === "paragraph" && (
              <div dangerouslySetInnerHTML={{ __html: block.html }} />
            )}
            {block.type === "image" && block.url && (
              <img src={block.url} alt={block.alt || ""} className="max-w-full h-auto" />
            )}
            {block.type === "video" && block.url && (
              <video controls src={block.url} className="max-w-full h-auto" />
            )}
            {block.type === "button" && (
              <a href={block.href} className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded">
                {block.label}
              </a>
            )}
            {block.type === "section" && (
              <div 
                className="grid gap-4" 
                style={{ 
                  gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))`,
                  gap: (block as any).layout?.gap || "1rem",
                  padding: (block as any).layout?.padding || "1rem",
                  margin: (block as any).layout?.margin || "0",
                  maxWidth: (block as any).layout?.maxWidth || "100%",
                  textAlign: (block as any).layout?.alignment || "left"
                }}
              >
                {block.columns.map((col, idx) => (
                  <div key={idx} className="space-y-4">
                    <PreviewRenderer blocks={col} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BlockContentEditor({ block, onChange }: { block: BlockType; onChange: (b: BlockType) => void }) {
  if (block.type === "heading") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Niveau du titre</label>
          <Select value={String(block.level)} onValueChange={(v) => onChange({ ...block, level: Number(v) as any })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((l) => (
                <SelectItem key={l} value={String(l)}>Titre {l} (H{l})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Texte du titre</label>
          <Input 
            value={block.text} 
            onChange={(e) => onChange({ ...block, text: e.target.value })} 
            className="mt-1"
            placeholder="Entrez le titre"
          />
        </div>
      </div>
    )
  }

  if (block.type === "paragraph") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Contenu du paragraphe</label>
          <RichTextEditor
            content={block.html}
            onChange={(html) => onChange({ ...block, html })}
            placeholder="Commencez à écrire votre contenu..."
            className="mt-1"
          />
        </div>
      </div>
    )
  }

  if (block.type === "image") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Image</label>
          <div className="flex gap-2 mt-1">
            <Input 
              value={block.url} 
              onChange={(e) => onChange({ ...block, url: e.target.value })} 
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={() => {
                setMediaLibraryType("image")
                setMediaLibraryOpen(true)
              }}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Bibliothèque
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Texte alternatif (alt)</label>
          <Input 
            value={block.alt || ""} 
            onChange={(e) => onChange({ ...block, alt: e.target.value })} 
            className="mt-1"
            placeholder="Description de l'image"
          />
        </div>
        {block.url && (
          <div>
            <label className="text-sm font-medium">Aperçu</label>
            <div className="mt-1">
              <img src={block.url} alt={block.alt || ""} className="max-w-full h-auto rounded border" />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (block.type === "video") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Vidéo</label>
          <div className="flex gap-2 mt-1">
            <Input 
              value={block.url} 
              onChange={(e) => onChange({ ...block, url: e.target.value })} 
              placeholder="https://example.com/video.mp4 ou URL YouTube/Vimeo"
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={() => {
                setMediaLibraryType("video")
                setMediaLibraryOpen(true)
              }}
            >
              <Video className="h-4 w-4 mr-2" />
              Bibliothèque
            </Button>
          </div>
        </div>
        {block.url && (
          <div>
            <label className="text-sm font-medium">Aperçu</label>
            <div className="mt-1">
              <video controls src={block.url} className="max-w-full h-auto rounded border" />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (block.type === "button") {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Texte du bouton</label>
          <Input 
            value={block.label} 
            onChange={(e) => onChange({ ...block, label: e.target.value })} 
            className="mt-1"
            placeholder="Texte du bouton"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Lien (URL)</label>
          <Input 
            value={block.href} 
            onChange={(e) => onChange({ ...block, href: e.target.value })} 
            className="mt-1"
            placeholder="https://example.com ou #section"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Aperçu</label>
          <div className="mt-1">
            <a 
              href={block.href} 
              className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 rounded hover:bg-primary/90 transition-colors"
            >
              {block.label || "Nouveau bouton"}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <div>Type de bloc non supporté pour l'édition</div>
}

function BlockEditor({ block, onChange, onDelete, onSelect, onEdit, isSelected }: { block: BlockType; onChange: (b: BlockType) => void; onDelete: () => void; onSelect: () => void; onEdit: () => void; isSelected: boolean }) {
  if (block.type === "heading") {
    return (
      <div 
        onClick={onSelect} 
        onDoubleClick={onEdit}
        className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        style={applyStyle((block as any).style)}
      >
        <div className="p-4 border-2 border-dashed border-transparent hover:border-primary/50 rounded-lg transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Select value={String(block.level)} onValueChange={(v) => onChange({ ...block, level: Number(v) as any })}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <SelectItem key={l} value={String(l)}>H{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">Titre</div>
          </div>
          <div className={`font-bold ${block.level === 1 ? 'text-4xl' : block.level === 2 ? 'text-3xl' : block.level === 3 ? 'text-2xl' : 'text-xl'}`}>
            {block.text || "Cliquez pour éditer le titre"}
          </div>
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (block.type === "paragraph") {
    return (
      <div 
        onClick={onSelect} 
        onDoubleClick={onEdit}
        className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        style={applyStyle((block as any).style)}
      >
        <div className="p-4 border-2 border-dashed border-transparent hover:border-primary/50 rounded-lg transition-colors">
          <div className="text-xs text-muted-foreground mb-2">Paragraphe</div>
          <div className="min-h-[60px]">
            {block.html ? (
              <div dangerouslySetInnerHTML={{ __html: block.html }} />
            ) : (
              <div className="text-muted-foreground italic">Cliquez pour éditer le paragraphe</div>
            )}
          </div>
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (block.type === "image") {
    return (
      <div 
        onClick={onSelect} 
        onDoubleClick={onEdit}
        className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        style={applyStyle((block as any).style)}
      >
        <div className="p-4 border-2 border-dashed border-transparent hover:border-primary/50 rounded-lg transition-colors">
          <div className="text-xs text-muted-foreground mb-2">Image</div>
          {block.url ? (
            <img src={block.url} alt={block.alt || ""} className="max-w-full h-auto rounded" />
          ) : (
            <div className="h-32 bg-muted rounded flex items-center justify-center">
              <div className="text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Cliquez pour ajouter une image</div>
              </div>
            </div>
          )}
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (block.type === "video") {
    return (
      <div 
        onClick={onSelect} 
        onDoubleClick={onEdit}
        className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        style={applyStyle((block as any).style)}
      >
        <div className="p-4 border-2 border-dashed border-transparent hover:border-primary/50 rounded-lg transition-colors">
          <div className="text-xs text-muted-foreground mb-2">Vidéo</div>
          {block.url ? (
            <video controls src={block.url} className="max-w-full h-auto rounded" />
          ) : (
            <div className="h-32 bg-muted rounded flex items-center justify-center">
              <div className="text-center">
                <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Cliquez pour ajouter une vidéo</div>
              </div>
            </div>
          )}
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (block.type === "button") {
    return (
      <div 
        onClick={onSelect} 
        onDoubleClick={onEdit}
        className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        style={applyStyle((block as any).style)}
      >
        <div className="p-4 border-2 border-dashed border-transparent hover:border-primary/50 rounded-lg transition-colors">
          <div className="text-xs text-muted-foreground mb-2">Bouton</div>
          <div className="inline-block">
            <a 
              href={block.href} 
              className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 rounded hover:bg-primary/90 transition-colors"
            >
              {block.label || "Nouveau bouton"}
            </a>
          </div>
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (block.type === "section") {
    return (
      <div 
        onClick={onSelect} 
        onDoubleClick={onEdit}
        className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        style={applyStyle((block as any).style)}
      >
        <div className="p-4 border-2 border-dashed border-transparent hover:border-primary/50 rounded-lg transition-colors">
          <div className="text-xs text-muted-foreground mb-2">Section ({block.columns.length} colonnes)</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))` }}>
            {block.columns.map((col, idx) => (
              <div key={idx} className="min-h-[100px] bg-muted/50 rounded p-4 text-center text-sm text-muted-foreground">
                Colonne {idx + 1}
              </div>
            ))}
          </div>
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return null
}

function StyleInspector({ block, onChange }: { block?: any; onChange: (style: any) => void }) {
  if (!block) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Style du bloc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Sélectionnez un bloc pour modifier son style
          </div>
        </CardContent>
      </Card>
    )
  }

  const style = block.style || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Style du bloc
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {block.type === "heading" && "Titre"}
          {block.type === "paragraph" && "Paragraphe"}
          {block.type === "image" && "Image"}
          {block.type === "video" && "Vidéo"}
          {block.type === "button" && "Bouton"}
          {block.type === "section" && "Section"}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Typography */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Typographie</h4>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Police" value={style.fontFamily || ""} onChange={(e) => onChange({ fontFamily: e.target.value })} />
            <Input placeholder="Taille" value={style.fontSize || ""} onChange={(e) => onChange({ fontSize: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={style.fontWeight || ""} onValueChange={(v) => onChange({ fontWeight: v })}>
              <SelectTrigger><SelectValue placeholder="Graisse" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semi-bold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
                <SelectItem value="800">Extra-bold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={style.textAlign || ""} onValueChange={(v) => onChange({ textAlign: v })}>
              <SelectTrigger><SelectValue placeholder="Alignement" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="center">Centre</SelectItem>
                <SelectItem value="right">Droite</SelectItem>
                <SelectItem value="justify">Justifié</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Input type="color" value={style.color || "#000000"} onChange={(e) => onChange({ color: e.target.value })} className="w-12 h-8" />
            <Input placeholder="Couleur du texte" value={style.color || ""} onChange={(e) => onChange({ color: e.target.value })} className="flex-1" />
          </div>
        </div>

        <Separator />

        {/* Spacing */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Espacement</h4>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Padding" value={style.padding || ""} onChange={(e) => onChange({ padding: e.target.value })} />
            <Input placeholder="Margin" value={style.margin || ""} onChange={(e) => onChange({ margin: e.target.value })} />
          </div>
        </div>

        <Separator />

        {/* Background & Border */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Apparence</h4>
          <div className="flex items-center gap-2">
            <Input type="color" value={style.backgroundColor || "#ffffff"} onChange={(e) => onChange({ backgroundColor: e.target.value })} className="w-12 h-8" />
            <Input placeholder="Couleur de fond" value={style.backgroundColor || ""} onChange={(e) => onChange({ backgroundColor: e.target.value })} className="flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Bordure" value={style.border || ""} onChange={(e) => onChange({ border: e.target.value })} />
            <Input placeholder="Rayon" value={style.borderRadius || ""} onChange={(e) => onChange({ borderRadius: e.target.value })} />
          </div>
          <Input placeholder="Ombre" value={style.boxShadow || ""} onChange={(e) => onChange({ boxShadow: e.target.value })} />
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Actions rapides</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => onChange({})}>
              Réinitialiser
            </Button>
            <Button variant="outline" size="sm" onClick={() => onChange({
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: "400",
              color: "#000000",
              textAlign: "left",
              backgroundColor: "transparent",
              padding: "0",
              margin: "0",
              border: "none",
              borderRadius: "0",
              boxShadow: "none"
            })}>
              Style par défaut
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function computeSeoScore(p: CmsPageDraft): { score: number; color: "green" | "orange" | "red" } {
  let score = 0
  if (p.title && p.title.length >= 30 && p.title.length <= 60) score += 25
  if (p.description && p.description.length >= 70 && p.description.length <= 160) score += 25
  const hasH1 = p.blocks.some((b) => b.type === "heading" && (b as any).level === 1)
  if (hasH1) score += 20
  const hasAlt = p.blocks.filter((b) => b.type === "image").every((b: any) => !!b.alt)
  if (hasAlt) score += 15
  if (p.slug && /^[a-z0-9-]+$/.test(p.slug)) score += 15
  const color = score >= 80 ? "green" : score >= 50 ? "orange" : "red"
  return { score, color }
}

export default dynamic(() => Promise.resolve(PageBuilder), { ssr: false })


