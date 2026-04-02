import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ardb.app",
        pathname: "/static/**",
      },
    ],
  },
};

export default nextConfig;
