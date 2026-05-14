import { getBufferAccessToken } from "@/lib/env";

/**
 * Güvenli OAuth başlangıç URL’si. Nexora UI Buffer markası göstermez; yönlendirme sunucuda kurulur.
 * @see https://developers.buffer.com/guides/authentication.html
 */
export function buildPublishConnectAuthorizeUrl(input: {
  platform: "instagram" | "tiktok";
  state: string;
}): string | null {
  const clientId = process.env.NEXORA_PUBLISH_OAUTH_CLIENT_ID?.trim();
  const redirectUri = process.env.NEXORA_PUBLISH_OAUTH_REDIRECT_URI?.trim();
  const authorizeBase =
    process.env.NEXORA_PUBLISH_OAUTH_AUTHORIZE_URL?.trim() || "https://buffer.com/oauth2/authorize";
  if (!clientId || !redirectUri) return null;

  const u = new URL(authorizeBase);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("state", `${input.platform}:${input.state}`);
  return u.toString();
}

export function isPublishConnectConfigured(): boolean {
  return Boolean(getBufferAccessToken() || process.env.NEXORA_PUBLISH_OAUTH_CLIENT_ID?.trim());
}
