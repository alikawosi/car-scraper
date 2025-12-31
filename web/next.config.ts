import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "is-plain-object",
    "merge-deep",
    "clone-deep",
    "kind-of",
    "shallow-clone",
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
