/** Buffer `Channel.service` değerleri (GraphQL) — Instagram, TikTok, LinkedIn, X. */

export const BUFFER_SOCIAL_SERVICES = ["instagram", "tiktok", "linkedin", "twitter"] as const;

export type BufferSocialService = (typeof BUFFER_SOCIAL_SERVICES)[number];

export function isBufferSocialService(service: string): service is BufferSocialService {
  return (BUFFER_SOCIAL_SERVICES as readonly string[]).includes(service);
}

/** Nexora UI / scheduled_posts.platform etiketi. */
export function bufferServiceToDisplayPlatform(service: string): string {
  switch (service) {
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "linkedin":
      return "LinkedIn";
    case "twitter":
      return "X";
    default:
      return service;
  }
}

/** Nexora metin platformundan (örn. "Instagram") Buffer service tahmini. */
export function guessBufferServiceFromNexoraPlatform(platform: string): BufferSocialService | null {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "instagram";
  if (p.includes("tiktok")) return "tiktok";
  if (p.includes("linkedin")) return "linkedin";
  if (p.includes("twitter") || p === "x" || p.includes(" x ")) return "twitter";
  return null;
}
