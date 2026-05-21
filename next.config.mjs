/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'uploadthing.com',
      'utfs.io',
      'lh3.googleusercontent.com',
      'cdn.discordapp.com',
      'media.tenor.com',
      'tenor.com'
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs']
  },
  // Optimize for Vercel
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false
  }
};

export default nextConfig;
