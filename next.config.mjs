/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // On ajoute '@sparticuz/chromium' pour s'assurer qu'il n'est pas "bundlé" par le serveur.
    // C'est la solution recommandée par Vercel.
    serverComponentsExternalPackages: ['sharp', 'tesseract.js', '@sparticuz/chromium', 'puppeteer-core"],
  },
  webpack: (config, { isServer }) => {
    // Configuration pour Tesseract.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Configuration pour PDF.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.min.js',
    }

    // Ignorer les warnings de modules
    config.ignoreWarnings = [
      { module: /node_modules\/tesseract\.js/ },
      { module: /node_modules\/pdfjs-dist/ },
    ]

    return config
  },
  images: {
    domains: ['blob.vercel-storage.com', 'cdnjs.cloudflare.com'],
    unoptimized: true,
  },
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig

