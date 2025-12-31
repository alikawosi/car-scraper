import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.atcdn.co.uk",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.gumtree.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ebayimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
