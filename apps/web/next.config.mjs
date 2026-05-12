import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@md-oss/design-system'],
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      // Dashboard Icons: Homarr Labs CDN
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/gh/homarr-labs/dashboard-icons/**',
      },
      // Dashboard Icons: @lobehub/icons-static-svg
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/npm/@lobehub/icons-static-svg@latest/icons/**',
      },
      // Dashboard Icons: @lobehub/icons-static-png
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/npm/@lobehub/icons-static-png@latest/dark/**',
      },
      // /docs README badges
      {
        protocol: 'https',
        hostname: 'img.shields.io',
        port: '',
        pathname: '/badge/**',
        // search: '?style=flat&logo=biome',
      },
    ],
  },
};

export default withMDX(config);
