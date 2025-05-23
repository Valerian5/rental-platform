/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration des packages externes (nouvelle syntaxe Next.js 15+)
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],
  
  // Désactivez la transpilation si vous utilisez serverExternalPackages
  // transpilePackages: [], // À commenter ou supprimer

  // Options de build
  output: 'standalone', // Essentiel pour Vercel
  reactStrictMode: true,
  
  // Gestion des erreurs
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimisation des images
  images: {
    unoptimized: true, // Désactive l'optimisation si nécessaire
    domains: [], // Ajoutez vos domaines d'images si nécessaire
  },
  
  // Configuration expérimentale (mise à jour)
  experimental: {
    // Ajoutez ici seulement les options encore supportées
    optimizePackageImports: [
      '@radix-ui/react-*', // Optimise les imports Radix UI
      'lucide-react',
    ],
  },
  
  // Configuration Webpack personnalisée si nécessaire
  webpack: (config) => {
    // Exemple: configuration pour les fichiers .node (bcrypt)
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    
    return config;
  },
};

export default nextConfig;