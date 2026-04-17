/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent pdf-parse test files from being bundled
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdf-parse/test': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
