import type { Metadata } from "next"
import { createServerClient } from "@supabase/ssr"

function supabaseAdmin() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const admin = supabaseAdmin()
  const { data } = await admin
    .from("cms_pages")
    .select("title, description, seo, status")
    .eq("slug", params.slug)
    .single()

  if (!data || data.status !== "published") return { title: "Not found" }

  const seo = (data.seo as any) || {}
  return {
    title: seo.metaTitle || data.title,
    description: seo.metaDescription || data.description || undefined,
    openGraph: seo.openGraph || undefined,
    twitter: seo.twitter || undefined,
  }
}

export default async function CmsPublicPage({ params }: { params: { slug: string } }) {
  const admin = supabaseAdmin()
  const { data } = await admin
    .from("cms_pages")
    .select("title, description, blocks, status")
    .eq("slug", params.slug)
    .single()

  if (!data || data.status !== "published") {
    return <div className="p-6">Page non trouvée</div>
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <article className="prose max-w-none">
        <Renderer blocks={data.blocks as any[]} />
      </article>
    </main>
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
  const borderWidth = style.borderWidth
  const borderStyle = style.borderStyle
  const borderColor = style.borderColor
  if (!css.border && (borderWidth || borderStyle || borderColor)) {
    const widthStr = borderWidth || (borderColor ? "1px" : undefined)
    const styleStr = borderStyle || (borderColor ? "solid" : undefined)
    css.border = `${widthStr || ""} ${styleStr || ""} ${borderColor || ""}`.trim()
  }
  if (style.borderRadius) css.borderRadius = style.borderRadius
  if (style.boxShadow) css.boxShadow = style.boxShadow
  if (style.width) css.width = style.width
  return css
}

function Renderer({ blocks }: { blocks: any[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b) => {
        if (b.type === "heading") {
          const Tag = (`h${b.level}` as unknown) as any
          return <Tag key={b.id} style={applyStyle(b.style)}>{b.text}</Tag>
        }
        if (b.type === "paragraph") {
          return <div key={b.id} style={applyStyle(b.style)} dangerouslySetInnerHTML={{ __html: b.html }} />
        }
        if (b.type === "image") {
          return <img key={b.id} src={b.url} alt={b.alt || ""} style={applyStyle(b.style)} />
        }
        if (b.type === "video") {
          return <video key={b.id} controls src={b.url} style={applyStyle(b.style)} />
        }
        if (b.type === "button") {
          const style = b.style || {}
          return (
            <a
              key={b.id}
              href={b.href}
              className="inline-flex items-center"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color,
                padding: style.padding || '12px 24px',
                borderRadius: style.borderRadius,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                border: style.border,
                boxShadow: style.boxShadow,
                textDecoration: style.textDecoration,
                display: 'inline-flex',
                alignItems: 'center',
                width: style.width,
              }}
            >
              {b.label}
            </a>
          )
        }
        if (b.type === "section") {
          return (
            <div key={b.id} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${b.columns.length}, minmax(0, 1fr))`, ...applyStyle(b.style) }}>
              {b.columns.map((col: any[], idx: number) => (
                <div key={idx} className="space-y-4">
                  <Renderer blocks={col} />
                </div>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}


