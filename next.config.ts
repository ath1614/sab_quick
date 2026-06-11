import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  headers: async () => [
    {
      // /preview route — allow same-origin iframe embedding
      source: "/preview",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        // No X-Frame-Options here = allows framing from same origin
      ],
    },
    {
      // All other routes — block framing
      source: "/((?!preview$).*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ],
    },
  ],
};

export default nextConfig;
