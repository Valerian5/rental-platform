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
              {page.blocks.map((b) => (
                <BlockEditor key={b.id} block={b} onChange={(nb) => setPage((p) => ({ ...p, blocks: p.blocks.map((x) => (x.id === nb.id ? nb : x)) }))} onDelete={() => setPage((p) => ({ ...p, blocks: p.blocks.filter((x) => x.id !== b.id) }))} />
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
      </div>
    </div>
  )
}

function BlockEditor({ block, onChange, onDelete }: { block: BlockType; onChange: (b: BlockType) => void; onDelete: () => void }) {
  if (block.type === "heading") {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
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
      <Card>
        <CardContent className="p-4 space-y-2">
          <Textarea value={block.html} onChange={(e) => onChange({ ...block, html: e.target.value })} rows={4} />
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "image") {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Input placeholder="URL de l'image" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} />
          <Input placeholder="Alt" value={block.alt || ""} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "video") {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Input placeholder="URL vidéo (YouTube, Vimeo, fichier)" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} />
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  if (block.type === "button") {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
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
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground">Section avec {block.columns.length} colonne(s)</div>
          <div className="text-right"><Button variant="destructive" onClick={onDelete}>Supprimer</Button></div>
        </CardContent>
      </Card>
    )
  }

  return null
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


