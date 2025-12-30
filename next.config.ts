import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yhkvvanmnbgrjayctniw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },

  // Enable compression
  compress: true,

  // Disable source maps in production for smaller bundle
  productionBrowserSourceMaps: false,

  // Experimental optimizations
  experimental: {
    // Tree-shake these packages for smaller bundles
    optimizePackageImports: [
      "@tabler/icons-react",
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
      "recharts",
    ],
  },

  // Temporary: Allow build with TypeScript/ESLint warnings during migration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
