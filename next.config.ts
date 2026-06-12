import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `output: 'export'` was removed so this deploys as a server-backed
  // Next.js app on Vercel — this is what enables API routes (the image upload
  // route) and proxy.ts route protection. The Capacitor native build should
  // now load the deployed Vercel URL via `server.url` instead of the static
  // `out/` bundle.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  headers: async () => [
    {
      // /preview route — allow same-origin iframe embedding
      source: "/preview",
      headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
    },
    {
      // All other routes — block framing + baseline security headers
      source: "/((?!preview$).*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

export default nextConfig;
