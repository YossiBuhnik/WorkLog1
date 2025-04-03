/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimizes the build for production
  poweredByHeader: false, // Removes the X-Powered-By header for security
  reactStrictMode: true,
  swcMinify: true, // Uses SWC for minification (faster than Terser)
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig 