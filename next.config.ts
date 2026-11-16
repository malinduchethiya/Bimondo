import type { NextConfig } from 'next';

const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === '1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? { output: 'export' as const } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  ...(!isStaticExport
    ? {
        experimental: {
          cpus: 1,
          webpackMemoryOptimizations: true,
          preloadEntriesOnStart: false,
        },
      }
    : {}),
  images: {
    ...(isStaticExport ? { unoptimized: true } : {}),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.bimondotours.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
