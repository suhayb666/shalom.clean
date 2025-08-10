/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Don’t run ESLint during builds (useful for Vercel)
      ignoreDuringBuilds: true,
    },
  };
  
  module.exports = nextConfig;
  