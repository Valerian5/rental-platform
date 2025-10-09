import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface CmsPage {
  id: string
  slug: string
  title: string
  description?: string
  blocks: any[]
  seo: any
  status: "draft" | "published"
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const { data: page, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (error || !page) {
    notFound()
  }

  const cmsPage = page as CmsPage

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head */}
      <head>
        <title>{cmsPage.seo?.metaTitle || cmsPage.title}</title>
        <meta name="description" content={cmsPage.seo?.metaDescription || cmsPage.description || ""} />
        {cmsPage.seo?.metaKeywords && <meta name="keywords" content={cmsPage.seo.metaKeywords} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={cmsPage.seo?.ogTitle || cmsPage.title} />
        <meta property="og:description" content={cmsPage.seo?.ogDescription || cmsPage.description || ""} />
        {cmsPage.seo?.ogImage && <meta property="og:image" content={cmsPage.seo.ogImage} />}
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={cmsPage.seo?.twitterTitle || cmsPage.title} />
        <meta name="twitter:description" content={cmsPage.seo?.twitterDescription || cmsPage.description || ""} />
        {cmsPage.seo?.twitterImage && <meta name="twitter:image" content={cmsPage.seo.twitterImage} />}
      </head>

      {/* Page Content */}
      <main className="container mx-auto px-4 py-8">
        {cmsPage.blocks.map((block: any) => (
          <div key={block.id} className="mb-8">
            {block.type === "heading" && (
              <h1 
                className="text-4xl font-bold mb-4"
                style={{
                  fontSize: block.style?.fontSize || "2.5rem",
                  fontWeight: block.style?.fontWeight || "700",
                  textAlign: block.style?.textAlign || "left",
                  color: block.style?.color || "#1a1a1a",
                  fontFamily: block.style?.fontFamily || "inherit",
                  margin: block.style?.margin || "0 0 1rem 0"
                }}
              >
                {block.text}
              </h1>
            )}
            
            {block.type === "paragraph" && (
              <div 
                className="prose prose-lg max-w-none"
                style={{
                  fontSize: block.style?.fontSize || "1rem",
                  lineHeight: block.style?.lineHeight || "1.6",
                  color: block.style?.color || "#333333",
                  fontFamily: block.style?.fontFamily || "inherit",
                  margin: block.style?.margin || "0 0 1rem 0"
                }}
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            )}
            
            {block.type === "image" && (
              <div 
                className="mb-4"
                style={{
                  textAlign: block.style?.textAlign || "left",
                  margin: block.style?.margin || "0 0 1rem 0"
                }}
              >
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  className="max-w-full h-auto rounded"
                  style={{
                    width: block.style?.width || "100%",
                    height: block.style?.height || "auto",
                    borderRadius: block.style?.borderRadius || "8px",
                    boxShadow: block.style?.boxShadow || "none"
                  }}
                />
              </div>
            )}
            
            {block.type === "video" && (
              <div 
                className="mb-4"
                style={{
                  textAlign: block.style?.textAlign || "left",
                  margin: block.style?.margin || "0 0 1rem 0"
                }}
              >
                <video
                  controls
                  src={block.url}
                  className="max-w-full h-auto rounded"
                  style={{
                    width: block.style?.width || "100%",
                    height: block.style?.height || "auto",
                    borderRadius: block.style?.borderRadius || "8px"
                  }}
                />
              </div>
            )}
            
            {block.type === "button" && (
              <div 
                className="mb-4"
                style={{
                  textAlign: block.style?.textAlign || "left",
                  margin: block.style?.margin || "0 0 1rem 0"
                }}
              >
                <a
                  href={block.href}
                  className="inline-block px-6 py-3 rounded font-medium transition-colors"
                  style={{
                    backgroundColor: block.style?.backgroundColor || "#3b82f6",
                    color: block.style?.color || "#ffffff",
                    padding: block.style?.padding || "12px 24px",
                    borderRadius: block.style?.borderRadius || "8px",
                    fontSize: block.style?.fontSize || "1rem",
                    fontWeight: block.style?.fontWeight || "600",
                    textDecoration: "none",
                    display: "inline-block"
                  }}
                >
                  {block.label}
                </a>
              </div>
            )}
            
            {block.type === "section" && (
              <div 
                className="mb-4"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))`,
                  gap: block.layout?.gap || "1rem",
                  padding: block.layout?.padding || "1rem",
                  margin: block.layout?.margin || "0",
                  maxWidth: block.layout?.maxWidth || "100%",
                  textAlign: block.layout?.alignment || "left"
                }}
              >
                {block.columns.map((col: any[], colIdx: number) => (
                  <div key={colIdx} className="space-y-4">
                    {col.map((subBlock: any) => (
                      <div key={subBlock.id}>
                        {subBlock.type === "heading" && (
                          <h2 
                            className="text-2xl font-semibold mb-2"
                            style={{
                              fontSize: subBlock.style?.fontSize || "1.5rem",
                              fontWeight: subBlock.style?.fontWeight || "600",
                              textAlign: subBlock.style?.textAlign || "left",
                              color: subBlock.style?.color || "#1a1a1a",
                              fontFamily: subBlock.style?.fontFamily || "inherit",
                              margin: subBlock.style?.margin || "0 0 0.5rem 0"
                            }}
                          >
                            {subBlock.text}
                          </h2>
                        )}
                        
                        {subBlock.type === "paragraph" && (
                          <div 
                            className="prose max-w-none"
                            style={{
                              fontSize: subBlock.style?.fontSize || "1rem",
                              lineHeight: subBlock.style?.lineHeight || "1.6",
                              color: subBlock.style?.color || "#333333",
                              fontFamily: subBlock.style?.fontFamily || "inherit",
                              margin: subBlock.style?.margin || "0 0 1rem 0"
                            }}
                            dangerouslySetInnerHTML={{ __html: subBlock.html }}
                          />
                        )}
                        
                        {subBlock.type === "image" && (
                          <div 
                            style={{
                              textAlign: subBlock.style?.textAlign || "left",
                              margin: subBlock.style?.margin || "0 0 1rem 0"
                            }}
                          >
                            <img
                              src={subBlock.url}
                              alt={subBlock.alt || ""}
                              className="max-w-full h-auto rounded"
                              style={{
                                width: subBlock.style?.width || "100%",
                                height: subBlock.style?.height || "auto",
                                borderRadius: subBlock.style?.borderRadius || "8px"
                              }}
                            />
                          </div>
                        )}
                        
                        {subBlock.type === "button" && (
                          <div 
                            style={{
                              textAlign: subBlock.style?.textAlign || "left",
                              margin: subBlock.style?.margin || "0 0 1rem 0"
                            }}
                          >
                            <a
                              href={subBlock.href}
                              className="inline-block px-4 py-2 rounded font-medium transition-colors"
                              style={{
                                backgroundColor: subBlock.style?.backgroundColor || "#3b82f6",
                                color: subBlock.style?.color || "#ffffff",
                                padding: subBlock.style?.padding || "8px 16px",
                                borderRadius: subBlock.style?.borderRadius || "6px",
                                fontSize: subBlock.style?.fontSize || "0.875rem",
                                fontWeight: subBlock.style?.fontWeight || "600",
                                textDecoration: "none",
                                display: "inline-block"
                              }}
                            >
                              {subBlock.label}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}

export async function generateStaticParams() {
  const { data: pages } = await supabase
    .from("cms_pages")
    .select("slug")
    .eq("status", "published")

  return pages?.map((page) => ({
    slug: page.slug,
  })) || []
}
