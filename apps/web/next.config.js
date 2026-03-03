/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wecare4you/ui", "@wecare4you/types"],
  images: {
    domains: ["res.cloudinary.com"],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
