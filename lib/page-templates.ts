import { BlockType } from "@/app/admin/page-builder/page"

export interface PageTemplate {
  id: string
  name: string
  description: string
  category: "landing" | "content" | "marketing" | "ecommerce"
  thumbnail: string
  blocks: BlockType[]
}

export interface BlockTemplate {
  id: string
  name: string
  description: string
  category: "text" | "media" | "layout" | "interactive"
  thumbnail: string
  block: BlockType
}

export const blockTemplates: BlockTemplate[] = [
  {
    id: "hero-title",
    name: "Titre Hero",
    description: "Grand titre principal avec style moderne",
    category: "text",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
    block: {
      id: "template-hero-title",
      type: "heading",
      level: 1,
      text: "Titre Principal Impactant",
      style: {
        fontSize: "3rem",
        fontWeight: "700",
        textAlign: "center",
        color: "#1a1a1a",
        margin: "2rem 0",
        fontFamily: "Inter, sans-serif"
      }
    }
  },
  {
    id: "subtitle",
    name: "Sous-titre",
    description: "Sous-titre élégant pour structurer le contenu",
    category: "text",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
    block: {
      id: "template-subtitle",
      type: "heading",
      level: 2,
      text: "Sous-titre descriptif",
      style: {
        fontSize: "1.5rem",
        fontWeight: "500",
        textAlign: "left",
        color: "#666666",
        margin: "1rem 0",
        fontFamily: "Inter, sans-serif"
      }
    }
  },
  {
    id: "rich-text",
    name: "Texte riche",
    description: "Paragraphe avec formatage avancé",
    category: "text",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
    block: {
      id: "template-rich-text",
      type: "paragraph",
      html: "<p>Voici un <strong>paragraphe de texte riche</strong> avec <em>formatage</em> et <a href='#'>liens</a>.</p><p>Vous pouvez ajouter plusieurs paragraphes et utiliser toutes les fonctionnalités de l'éditeur de texte.</p>",
      style: {
        fontSize: "1rem",
        lineHeight: "1.6",
        color: "#333333",
        margin: "1rem 0"
      }
    }
  },
  {
    id: "cta-button",
    name: "Bouton CTA",
    description: "Bouton d'appel à l'action attractif",
    category: "interactive",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
    block: {
      id: "template-cta-button",
      type: "button",
      label: "Découvrir maintenant",
      href: "#",
      style: {
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "600",
        textAlign: "center",
        display: "inline-block",
        textDecoration: "none",
        transition: "all 0.3s ease"
      }
    }
  },
  {
    id: "image-card",
    name: "Carte image",
    description: "Image avec légende et style moderne",
    category: "media",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
    block: {
      id: "template-image-card",
      type: "image",
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
      alt: "Image d'exemple",
      style: {
        width: "100%",
        height: "auto",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        margin: "1rem 0"
      }
    }
  },
  {
    id: "two-columns",
    name: "2 colonnes",
    description: "Section avec 2 colonnes égales",
    category: "layout",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
    block: {
      id: "template-two-columns",
      type: "section",
      columns: [[], []],
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2rem",
        padding: "2rem 0"
      },
      layout: {
        columns: 2,
        gap: "2rem",
        padding: "2rem 0",
        margin: "0",
        maxWidth: "100%",
        alignment: "left",
        responsive: {
          mobile: { columns: 1, gap: "1rem" },
          tablet: { columns: 2, gap: "1.5rem" },
          desktop: { columns: 2, gap: "2rem" }
        }
      }
    }
  },
  {
    id: "three-columns",
    name: "3 colonnes",
    description: "Section avec 3 colonnes égales",
    category: "layout",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
    block: {
      id: "template-three-columns",
      type: "section",
      columns: [[], [], []],
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "1.5rem",
        padding: "2rem 0"
      },
      layout: {
        columns: 3,
        gap: "1.5rem",
        padding: "2rem 0",
        margin: "0",
        maxWidth: "100%",
        alignment: "left",
        responsive: {
          mobile: { columns: 1, gap: "1rem" },
          tablet: { columns: 2, gap: "1.5rem" },
          desktop: { columns: 3, gap: "1.5rem" }
        }
      }
    }
  }
]

export const pageTemplates: PageTemplate[] = [
  {
    id: "landing-hero",
    name: "Page d'accueil Hero",
    description: "Page d'accueil avec section hero et CTA",
    category: "landing",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop",
    blocks: [
      {
        id: "hero-title",
        type: "heading",
        level: 1,
        text: "Bienvenue sur notre plateforme",
        style: {
          fontSize: "3.5rem",
          fontWeight: "700",
          textAlign: "center",
          color: "#1a1a1a",
          margin: "4rem 0 2rem 0",
          fontFamily: "Inter, sans-serif"
        }
      },
      {
        id: "hero-subtitle",
        type: "paragraph",
        html: "<p>Découvrez une solution innovante qui transforme votre façon de travailler. Rejoignez des milliers d'utilisateurs satisfaits.</p>",
        style: {
          fontSize: "1.25rem",
          textAlign: "center",
          color: "#666666",
          margin: "0 0 3rem 0",
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto"
        }
      },
      {
        id: "hero-cta",
        type: "button",
        label: "Commencer maintenant",
        href: "#",
        style: {
          backgroundColor: "#3b82f6",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontSize: "1.125rem",
          fontWeight: "600",
          textAlign: "center",
          display: "block",
          width: "fit-content",
          margin: "0 auto",
          textDecoration: "none"
        }
      }
    ]
  },
  {
    id: "about-page",
    name: "Page À propos",
    description: "Page de présentation avec texte et images",
    category: "content",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop",
    blocks: [
      {
        id: "about-title",
        type: "heading",
        level: 1,
        text: "À propos de nous",
        style: {
          fontSize: "2.5rem",
          fontWeight: "600",
          textAlign: "center",
          color: "#1a1a1a",
          margin: "2rem 0"
        }
      },
      {
        id: "about-content",
        type: "section",
        columns: [
          [
            {
              id: "about-text",
              type: "paragraph",
              html: "<p>Nous sommes une équipe passionnée qui croit en l'innovation et l'excellence. Notre mission est de créer des solutions qui simplifient la vie de nos utilisateurs.</p><p>Avec plus de 10 ans d'expérience, nous avons développé une expertise unique dans notre domaine.</p>",
              style: {
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#333333"
              }
            }
          ],
          [
            {
              id: "about-image",
              type: "image",
              url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop",
              alt: "Équipe de travail",
              style: {
                width: "100%",
                height: "auto",
                borderRadius: "8px"
              }
            }
          ]
        ],
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "3rem",
          padding: "2rem 0",
          alignItems: "center"
        },
        layout: {
          columns: 2,
          gap: "3rem",
          padding: "2rem 0",
          margin: "0",
          maxWidth: "100%",
          alignment: "left",
          responsive: {
            mobile: { columns: 1, gap: "2rem" },
            tablet: { columns: 2, gap: "2.5rem" },
            desktop: { columns: 2, gap: "3rem" }
          }
        }
      }
    ]
  },
  {
    id: "contact-page",
    name: "Page Contact",
    description: "Page de contact avec informations et CTA",
    category: "content",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop",
    blocks: [
      {
        id: "contact-title",
        type: "heading",
        level: 1,
        text: "Contactez-nous",
        style: {
          fontSize: "2.5rem",
          fontWeight: "600",
          textAlign: "center",
          color: "#1a1a1a",
          margin: "2rem 0"
        }
      },
      {
        id: "contact-info",
        type: "paragraph",
        html: "<p><strong>Email:</strong> contact@example.com</p><p><strong>Téléphone:</strong> +33 1 23 45 67 89</p><p><strong>Adresse:</strong> 123 Rue de la Paix, 75001 Paris</p>",
        style: {
          fontSize: "1.125rem",
          textAlign: "center",
          color: "#333333",
          margin: "2rem 0",
          padding: "2rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px"
        }
      },
      {
        id: "contact-cta",
        type: "button",
        label: "Envoyer un message",
        href: "mailto:contact@example.com",
        style: {
          backgroundColor: "#10b981",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "600",
          textAlign: "center",
          display: "block",
          width: "fit-content",
          margin: "0 auto",
          textDecoration: "none"
        }
      }
    ]
  }
]

export function createBlockFromTemplate(template: BlockTemplate): BlockType {
  return {
    ...template.block,
    id: crypto.randomUUID()
  }
}

export function createPageFromTemplate(template: PageTemplate): BlockType[] {
  return template.blocks.map(block => ({
    ...block,
    id: crypto.randomUUID()
  }))
}
