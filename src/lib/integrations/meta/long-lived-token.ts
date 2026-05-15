import { getMetaAppCredentials, META_OAUTH_GRAPH_BASE } from "@/lib/integrations/meta/oauth";
import { normalizeMetaApiError } from "@/lib/integrations/meta/meta-api-errors";

export type LongLivedTokenResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

/**
 * Kısa ömürlü kullanıcı token'ını uzun ömürlü token ile değiştirir (~60 gün).
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 */
export async function exchangeMetaLongLivedUserToken(
  shortLivedToken: string,
): Promise<{ ok: true; token: LongLivedTokenResult } | { ok: false; error: string }> {
  const creds = getMetaAppCredentials();
  if (!creds) {
    return { ok: false, error: "META_APP_ID / META_APP_SECRET tanımlı değil." };
  }

  const url = new URL(`${META_OAUTH_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", creds.appId);
  url.searchParams.set("client_secret", creds.appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const res = await fetch(url.toString(), { method: "GET" });
  const raw = await res.text();

  let json: {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: { message?: string };
  } = {};
  try {
    json = raw ? (JSON.parse(raw) as typeof json) : {};
  } catch {
    return { ok: false, error: "Meta long-lived token yanıtı geçersiz JSON." };
  }

  if (!res.ok || !json.access_token) {
    const norm = normalizeMetaApiError({ httpStatus: res.status, body: raw });
    return { ok: false, error: norm.message };
  }

  return {
    ok: true,
    token: {
      accessToken: json.access_token,
      tokenType: json.token_type ?? "Bearer",
      expiresIn: typeof json.expires_in === "number" ? json.expires_in : 5184000,
    },
  };
}

export function expiresAtFromSeconds(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
