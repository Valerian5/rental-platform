/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ajoutez cette configuration pour résoudre les problèmes de modules
  transpilePackages: ['bcryptjs', 'jsonwebtoken'],
  
  // Ajoutez cette configuration pour les API routes
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken'],
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
