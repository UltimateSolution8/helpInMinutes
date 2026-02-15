/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    return [
      {
        source: '/api/services/identity/:path*',
        destination: `${process.env.IDENTITY_SERVICE_URL || 'http://localhost:8081'}/api/:path*`,
      },
      {
        source: '/api/services/task/:path*',
        destination: `${process.env.TASK_SERVICE_URL || 'http://localhost:8082'}/api/:path*`,
      },
      {
        source: '/api/services/matching/:path*',
        destination: `${process.env.MATCHING_SERVICE_URL || 'http://localhost:8083'}/api/:path*`,
      },
      {
        source: '/api/services/payment/:path*',
        destination: `${process.env.PAYMENT_SERVICE_URL || 'http://localhost:8084'}/api/:path*`,
      },
      {
        source: '/api/services/realtime/:path*',
        destination: `${process.env.REALTIME_SERVICE_URL || 'http://localhost:8085'}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.helpinminutes.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
