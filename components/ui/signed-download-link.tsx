"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignedDownloadLinkProps {
  bucket: string;
  /** Full URL from database, will extract path automatically */
  fileUrl: string;
  label?: string;
  className?: string;
}

/**
 * Download link component that fetches signed URL on click
 * Works with private Supabase Storage buckets
 */
export function SignedDownloadLink({
  bucket,
  fileUrl,
  label = "Download",
  className,
}: SignedDownloadLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Extract path from full Supabase URL
  // Example: https://xxx.supabase.co/storage/v1/object/public/assignments/path/to/file.pdf
  // We need: path/to/file.pdf
  const extractPath = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Pattern: /storage/v1/object/public/{bucket}/{path}
      // or: /storage/v1/object/{bucket}/{path}
      const match = pathname.match(
        /\/storage\/v1\/object(?:\/public)?\/[^/]+\/(.+)/
      );
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }

      // Fallback: assume it's just a path
      return url;
    } catch {
      // If URL parsing fails, return as-is
      return url;
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);

    try {
      const path = extractPath(fileUrl);

      const response = await fetch(
        `/api/storage/signed-url?bucket=${encodeURIComponent(
          bucket
        )}&path=${encodeURIComponent(path)}`
      );

      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const { signedUrl } = await response.json();

      // Open in new tab
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      alert("Gagal mengunduh file. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:opacity-50",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
