/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpiler les packages externes
  transpilePackages: ['bcryptjs', 'jsonwebtoken', '@supabase/supabase-js'],
  
  // Configuration pour les API routes - correction de la clé
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken', '@supabase/supabase-js'],
  },
  
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
