/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;

