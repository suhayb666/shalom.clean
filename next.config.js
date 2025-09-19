  /** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't run ESLint during builds (useful for Vercel)
    ignoreDuringBuilds: true,
  },
  /* add any other config options here */
};

module.exports = nextConfig;