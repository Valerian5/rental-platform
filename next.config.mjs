/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour les API routes - gardons seulement les packages serveur ici
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken'],
  },
  
  // Transpiler seulement Supabase pour le client
  transpilePackages: ['@supabase/supabase-js'],
  
  // Autres configurations
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;