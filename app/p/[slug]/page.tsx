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

function Renderer({ blocks }: { blocks: any[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b) => {
        if (b.type === "heading") {
          const Tag = (`h${b.level}` as unknown) as any
          return <Tag key={b.id}>{b.text}</Tag>
        }
        if (b.type === "paragraph") {
          return <div key={b.id} dangerouslySetInnerHTML={{ __html: b.html }} />
        }
        if (b.type === "image") {
          return <img key={b.id} src={b.url} alt={b.alt || ""} />
        }
        if (b.type === "video") {
          return <video key={b.id} controls src={b.url} />
        }
        if (b.type === "button") {
          return (
            <a key={b.id} href={b.href} className="inline-flex items-center rounded bg-primary px-4 py-2 text-white">
              {b.label}
            </a>
          )
        }
        if (b.type === "section") {
          return (
            <div key={b.id} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${b.columns.length}, minmax(0, 1fr))` }}>
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


