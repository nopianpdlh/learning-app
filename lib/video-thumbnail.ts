/**
 * Video Thumbnail Utility
 * Extract thumbnails from YouTube, Vimeo, and Google Drive video URLs
 */

export interface VideoInfo {
  platform: "youtube" | "vimeo" | "drive" | "unknown";
  videoId: string | null;
  thumbnailUrl: string | null;
  embedUrl: string | null;
}

/**
 * Extract video ID from various video platform URLs
 */
export function extractVideoId(url: string): VideoInfo {
  if (!url) {
    return {
      platform: "unknown",
      videoId: null,
      thumbnailUrl: null,
      embedUrl: null,
    };
  }

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        platform: "youtube",
        videoId,
        thumbnailUrl: getYouTubeThumbnail(videoId),
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        platform: "vimeo",
        videoId,
        thumbnailUrl: null, // Vimeo requires API call for thumbnail
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
      };
    }
  }

  // Google Drive patterns
  const drivePatterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of drivePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        platform: "drive",
        videoId,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${videoId}&sz=w640`,
        embedUrl: `https://drive.google.com/file/d/${videoId}/preview`,
      };
    }
  }

  return {
    platform: "unknown",
    videoId: null,
    thumbnailUrl: null,
    embedUrl: null,
  };
}

/**
 * Get YouTube thumbnail URL
 * Tries maxresdefault first, falls back to hqdefault
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: "maxres" | "hq" | "mq" | "sd" = "maxres"
): string {
  const qualityMap = {
    maxres: "maxresdefault",
    hq: "hqdefault",
    mq: "mqdefault",
    sd: "sddefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Get all available YouTube thumbnails
 */
export function getYouTubeThumbnails(videoId: string): {
  maxres: string;
  hq: string;
  mq: string;
  sd: string;
  default: string;
} {
  return {
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
  };
}

/**
 * Auto-detect and get thumbnail from any video URL
 */
export function getVideoThumbnail(videoUrl: string): string | null {
  const videoInfo = extractVideoId(videoUrl);
  return videoInfo.thumbnailUrl;
}

/**
 * Check if URL is a video URL from supported platforms
 */
export function isVideoUrl(url: string): boolean {
  const videoInfo = extractVideoId(url);
  return videoInfo.platform !== "unknown";
}

/**
 * Get embed URL for video
 */
export function getVideoEmbedUrl(videoUrl: string): string | null {
  const videoInfo = extractVideoId(videoUrl);
  return videoInfo.embedUrl;
}
