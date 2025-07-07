/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'default',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.buymeacoffee.com',
        pathname: '/buttons/**',
      },
    ],
    unoptimized: true, // Allow base64 images without optimization
  },
  experimental: {
    forceSwcTransforms: true,
  },

  // Enable standalone output for containerized deployment
  output: 'standalone',
};

module.exports = nextConfig;
