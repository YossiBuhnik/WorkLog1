/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimizes the build for production
  poweredByHeader: false, // Removes the X-Powered-By header for security
  reactStrictMode: true,
  swcMinify: false, // Temporarily disable minification for better error messages
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  webpack: (config, { dev, isServer }) => {
    // Use development version of React
    if (!dev) {
      Object.assign(config.resolve.alias, {
        'react': 'react/profiling',
        'react-dom': 'react-dom/profiling',
        'scheduler/tracing': 'scheduler/tracing-profiling',
      });
    }
    return config;
  },
  // Indicate where the app directory is located
  experimental: {
    appDir: true,
  }
}

module.exports = nextConfig 