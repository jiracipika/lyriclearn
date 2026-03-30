/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lyriclearn/core', '@lyriclearn/ui'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
