import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable to test
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.egdesk.cloud',
          },
        ],
        destination: 'https://egdesk.cloud/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
