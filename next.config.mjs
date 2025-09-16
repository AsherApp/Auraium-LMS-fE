/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [],
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
}

export default nextConfig
