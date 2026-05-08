import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disable to test
  experimental: {
    serverActions: {
      // Allow Server Actions requests forwarded through the tunnel service
      allowedOrigins: ["tunneling-service.onrender.com"],
    },
  },
};

export default nextConfig;
