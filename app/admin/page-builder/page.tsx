"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type BlockType =
  | { id: string; type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string; style?: any }
  | { id: string; type: "paragraph"; html: string; style?: any }
  | { id: string; type: "image"; url: string; alt?: string; style?: any }
  | { id: string; type: "video"; url: string; provider?: "youtube" | "vimeo" | "file"; style?: any }
  | { id: string; type: "button"; label: string; href: string; style?: any }
  | { id: string; type: "section"; columns: BlockType[][]; style?: any }

interface CmsPageDraft {
  id?: string
  slug: string
  title: string
  description?: string
  blocks: BlockType[]
  seo: any
  status: "draft" | "published"
}

export default function PageBuilder() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState<CmsPageDraft>({ slug: "", title: "", description: "", blocks: [], seo: {}, status: "draft" })

  useEffect(() => {
    ;(async () => {
      const user = await authService.getCurrentUser()
      if (!user) return router.push("/login")
      if (user.user_type !== "admin") return router.push("/")
      setLoading(false)
    })()
  }, [router])

  const seoScore = useMemo(() => computeSeoScore(page), [page])

  const addBlock = (type: BlockType["type"]) => {
    const id = crypto.randomUUID()
    const newBlock: BlockType =
      type === "heading"
        ? { id, type, level: 1, text: "Titre" }
        : type === "paragraph"
          ? { id, type, html: "Paragraphe" }
          : type === "image"
            ? { id, type, url: "", alt: "" }
            : type === "video"
              ? { id, type, url: "" }
              : type === "button"
                ? { id, type, label: "Bouton", href: "#" }
                : { id, type: "section", columns: [[]] }
    setPage((p) => ({ ...p, blocks: [...p.blocks, newBlock] }))
  }

  const [dragIndex, setDragIndex] = useState<number | null>(null)

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
    <div className="p-6 grid grid-cols-4 gap-6">
      <div className="col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Éditeur de page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => addBlock("heading")}>Titre</Button>
              <Button variant="secondary" onClick={() => addBlock("paragraph")}>Texte</Button>
              <Button variant="secondary" onClick={() => addBlock("image")}>Image</Button>
              <Button variant="secondary" onClick={() => addBlock("video")}>Vidéo</Button>
              <Button variant="secondary" onClick={() => addBlock("button")}>Bouton</Button>
              <Button variant="secondary" onClick={() => addBlock("section")}>Section</Button>
            </div>

            <div className="space-y-3">
              {page.blocks.map((b, i) => (
                <div key={b.id} draggable onDragStart={() => onDragStart(i)} onDragOver={onDragOver} onDrop={() => onDrop(i)} className="border rounded">
                  <div className="flex items-center justify-between px-3 py-1 text-xs text-muted-foreground bg-muted cursor-move">
                    <span>Bloc {i + 1} · {b.type}</span>
                    <span>⋮⋮</span>
                  </div>
                  <BlockEditor
                    block={b}
                    onChange={(nb) => setPage((p) => ({ ...p, blocks: p.blocks.map((x) => (x.id === nb.id ? nb : x)) }))}
                    onDelete={() => setPage((p) => ({ ...p, blocks: p.blocks.filter((x) => x.id !== b.id) }))}
                    onSelect={() => setSelectedBlockId(b.id)}
                    isSelected={selectedBlockId === b.id}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Slug" value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })} />
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
            <div className="text-sm">SEO: <span className={seoScore.color === "green" ? "text-green-600" : seoScore.color === "orange" ? "text-orange-600" : "text-red-600"}>{seoScore.score}/100</span></div>
            <div className="flex gap-2">
              <Button onClick={() => save(false)} disabled={saving}>Sauvegarder</Button>
              <Button onClick={() => save(true)} disabled={saving} variant="default">Publier</Button>
            </div>
          </CardContent>
        </Card>

        <StyleInspector
          block={page.blocks.find((b) => b.id === selectedBlockId)}
          onChange={(style) =>
            setPage((p) => ({
              ...p,
              blocks: p.blocks.map((b) => (b.id === selectedBlockId ? ({ ...b, style: { ...(b as any).style, ...style } } as any) : b)),
            }))
          }
        />
      </div>
    </div>
  )
}

const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

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

function BlockEditor({ block, onChange, onDelete, onSelect, isSelected }: { block: BlockType; onChange: (b: BlockType) => void; onDelete: () => void; onSelect: () => void; isSelected: boolean }) {
  if (block.type === "heading") {
    return (
      <Card onClick={onSelect} className={isSelected ? "ring-2 ring-primary" : ""}>
        <CardContent className="p-4 space-y-2" style={applyStyle((block as any).style)}>
          <div className="flex gap-2">
            <Select value={String(block.level)} onValueChange={(v) => onChange({ ...block, level: Number(v) as any })}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <SelectItem key={l} value={String(l)}>H{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} className="flex-1" />
            <Button variant="destructive" onClick={onDelete}>Supprimer</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "paragraph") {
    return (
      <Card onClick={onSelect} className={isSelected ? "ring-2 ring-primary" : ""}>
        <CardContent className="p-4 space-y-2" style={applyStyle((block as any).style)}>
          <Textarea value={block.html} onChange={(e) => onChange({ ...block, html: e.target.value })} rows={4} />
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "image") {
    return (
      <Card onClick={onSelect} className={isSelected ? "ring-2 ring-primary" : ""}>
        <CardContent className="p-4 space-y-2" style={applyStyle((block as any).style)}>
          <Input placeholder="URL de l'image" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} />
          <Input placeholder="Alt" value={block.alt || ""} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "video") {
    return (
      <Card onClick={onSelect} className={isSelected ? "ring-2 ring-primary" : ""}>
        <CardContent className="p-4 space-y-2" style={applyStyle((block as any).style)}>
          <Input placeholder="URL vidéo (YouTube, Vimeo, fichier)" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} />
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "button") {
    return (
      <Card onClick={onSelect} className={isSelected ? "ring-2 ring-primary" : ""}>
        <CardContent className="p-4 space-y-2" style={applyStyle((block as any).style)}>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Label" value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} />
            <Input placeholder="Lien" value={block.href} onChange={(e) => onChange({ ...block, href: e.target.value })} />
          </div>
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "section") {
    return (
      <Card onClick={onSelect} className={isSelected ? "ring-2 ring-primary" : ""}>
        <CardContent className="p-4 space-y-2" style={applyStyle((block as any).style)}>
          <div className="text-sm text-muted-foreground">Section avec {block.columns.length} colonne(s)</div>
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  return null
}

function StyleInspector({ block, onChange }: { block?: any; onChange: (style: any) => void }) {
  if (!block) return null
  const style = block.style || {}
  return (
    <Card>
      <CardHeader>
        <CardTitle>Style du bloc</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Police (ex: Inter, Arial)" value={style.fontFamily || ""} onChange={(e) => onChange({ fontFamily: e.target.value })} />
        <Input placeholder="Taille (ex: 16px, 1.25rem)" value={style.fontSize || ""} onChange={(e) => onChange({ fontSize: e.target.value })} />
        <Select value={style.fontWeight || ""} onValueChange={(v) => onChange({ fontWeight: v })}>
          <SelectTrigger><SelectValue placeholder="Graisse" /></SelectTrigger>
          <SelectContent>
            {["300","400","500","600","700","800"].map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="color" value={style.color || "#000000"} onChange={(e) => onChange({ color: e.target.value })} />
        <Select value={style.textAlign || ""} onValueChange={(v) => onChange({ textAlign: v })}>
          <SelectTrigger><SelectValue placeholder="Alignement" /></SelectTrigger>
          <SelectContent>
            {(["left","center","right","justify"] as const).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Fond (ex: #f5f5f5)" value={style.backgroundColor || ""} onChange={(e) => onChange({ backgroundColor: e.target.value })} />
        <Input placeholder="Padding (ex: 16px 24px)" value={style.padding || ""} onChange={(e) => onChange({ padding: e.target.value })} />
        <Input placeholder="Margin (ex: 24px 0)" value={style.margin || ""} onChange={(e) => onChange({ margin: e.target.value })} />
        <Input placeholder="Bordure (ex: 1px solid #ddd)" value={style.border || ""} onChange={(e) => onChange({ border: e.target.value })} />
        <Input placeholder="Rayon (ex: 8px)" value={style.borderRadius || ""} onChange={(e) => onChange({ borderRadius: e.target.value })} />
        <Input placeholder="Ombre (ex: 0 2px 8px rgba(0,0,0,.1))" value={style.boxShadow || ""} onChange={(e) => onChange({ boxShadow: e.target.value })} />
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


