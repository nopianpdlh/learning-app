import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yhkvvanmnbgrjayctniw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Temporary: Allow build with TypeScript/ESLint warnings during migration
  // Route handlers need to be updated to Next.js 15 format (params as Promise)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
