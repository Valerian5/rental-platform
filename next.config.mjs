/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpiler les packages externes
  transpilePackages: ['bcryptjs', 'jsonwebtoken'],
  
  // Configuration pour les API routes
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