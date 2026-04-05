/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
      {
        source: '/hubs/:path*',
        destination: `${process.env.NEXT_PUBLIC_WS_URL}/hubs/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
