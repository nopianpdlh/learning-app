/**
 * Image Utilities
 * Provides blur placeholder and image optimization helpers
 */

// Default blur placeholder - a tiny transparent SVG encoded as base64
// This provides a smooth loading experience before the actual image loads
export const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

// Gradient blur placeholder with brand colors
export const GRADIENT_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzNiODJmNjtzdG9wLW9wYWNpdHk6MC4yIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojOGI1Y2Y2O3N0b3Atb3BhY2l0eTowLjIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+";

// Shimmer animation placeholder
export const SHIMMER_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=";

/**
 * Generate a tiny blur placeholder from image dimensions
 * Uses SVG for minimal size
 */
export function generatePlaceholder(
  width: number = 100,
  height: number = 100
): string {
  const aspectRatio = width / height;
  const placeholderWidth = 10;
  const placeholderHeight = Math.round(placeholderWidth / aspectRatio);

  const svg = `<svg width="${placeholderWidth}" height="${placeholderHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#e5e7eb"/></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Get appropriate placeholder based on image type
 */
export function getPlaceholder(
  type: "default" | "gradient" | "shimmer" = "default"
): string {
  switch (type) {
    case "gradient":
      return GRADIENT_BLUR_DATA_URL;
    case "shimmer":
      return SHIMMER_BLUR_DATA_URL;
    default:
      return DEFAULT_BLUR_DATA_URL;
  }
}

/**
 * Image component props helper
 * Returns common props for Next.js Image with blur placeholder
 */
export function getImageProps(options?: {
  priority?: boolean;
  placeholder?: "default" | "gradient" | "shimmer";
}) {
  return {
    placeholder: "blur" as const,
    blurDataURL: getPlaceholder(options?.placeholder),
    priority: options?.priority ?? false,
  };
}
