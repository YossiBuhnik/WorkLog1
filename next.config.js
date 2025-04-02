/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimizes the build for production
  poweredByHeader: false, // Removes the X-Powered-By header for security
  reactStrictMode: true,
  swcMinify: true, // Uses SWC for minification (faster than Terser)
}

module.exports = nextConfig 