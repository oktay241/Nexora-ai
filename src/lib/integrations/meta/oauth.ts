/** Meta (Facebook Login) OAuth — Instagram bağlantısı */
export const META_OAUTH_AUTHORIZE_URL = "https://www.facebook.com/v22.0/dialog/oauth";
export const META_OAUTH_TOKEN_URL = "https://graph.facebook.com/v22.0/oauth/access_token";
export const META_OAUTH_GRAPH_BASE = "https://graph.facebook.com/v22.0";

export const META_OAUTH_SCOPES =
  "instagram_basic,instagram_content_publish,pages_show_list,business_management";

export const META_OAUTH_STATE_COOKIE = "nexora_meta_oauth_state";

export function getMetaOAuthRedirectUri(): string | null {
  const uri = process.env.NEXORA_PUBLISH_OAUTH_REDIRECT_URI?.trim();
  return uri && uri.length > 0 ? uri : null;
}

export function getMetaAppCredentials(): { appId: string; appSecret: string } | null {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;
  return { appId, appSecret };
}

export function isMetaOAuthConfigured(): boolean {
  return Boolean(getMetaAppCredentials() && getMetaOAuthRedirectUri());
}

export function buildMetaAuthorizeUrl(input: { state: string }): string | null {
  const creds = getMetaAppCredentials();
  const redirectUri = getMetaOAuthRedirectUri();
  if (!creds || !redirectUri) return null;

  const u = new URL(META_OAUTH_AUTHORIZE_URL);
  u.searchParams.set("client_id", creds.appId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", META_OAUTH_SCOPES);
  u.searchParams.set("state", input.state);
  return u.toString();
}

export type MetaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; type?: string; code?: number };
};

export type MetaMeResponse = {
  id?: string;
  name?: string;
  error?: { message?: string; type?: string; code?: number };
};

export type MetaInstagramAccount = {
  pageName: string;
  instagramId: string;
  username: string;
};

function metaDebugEnabled(): boolean {
  return process.env.NEXORA_DEBUG_OAUTH === "1" || process.env.NODE_ENV !== "production";
}

/**
 * Authorization code → short-lived user access token.
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 */
export async function exchangeMetaAuthorizationCode(input: {
  code: string;
}): Promise<{ ok: true; accessToken: string; raw: MetaTokenResponse } | { ok: false; error: string }> {
  const creds = getMetaAppCredentials();
  const redirectUri = getMetaOAuthRedirectUri();
  if (!creds || !redirectUri) {
    return { ok: false, error: "Meta OAuth yapılandırması eksik (META_APP_ID / META_APP_SECRET / redirect URI)." };
  }

  const tokenUrl = new URL(META_OAUTH_TOKEN_URL);
  tokenUrl.searchParams.set("client_id", creds.appId);
  tokenUrl.searchParams.set("client_secret", creds.appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", input.code);

  if (metaDebugEnabled()) {
    console.log("[nexora.oauth.meta]", {
      step: "token_exchange",
      tokenUrl: META_OAUTH_TOKEN_URL,
      client_id: creds.appId,
      redirect_uri: redirectUri,
      has_client_secret: Boolean(creds.appSecret),
    });
  }

  const res = await fetch(tokenUrl.toString(), { method: "GET" });
  const raw = (await res.json()) as MetaTokenResponse;

  if (metaDebugEnabled()) {
    console.log("[nexora.oauth.meta]", "token response", {
      httpStatus: res.status,
      has_access_token: Boolean(raw.access_token),
      error: raw.error ?? null,
    });
  }

  if (!res.ok || raw.error || !raw.access_token) {
    const msg =
      raw.error?.message ??
      (typeof raw === "object" && "error" in raw ? JSON.stringify(raw) : "Token exchange başarısız.");
    return { ok: false, error: msg };
  }

  return { ok: true, accessToken: raw.access_token, raw };
}

export async function fetchMetaUserProfile(accessToken: string): Promise<{
  me: MetaMeResponse | null;
  instagram: MetaInstagramAccount | null;
  error: string | null;
}> {
  const meUrl = new URL(`${META_OAUTH_GRAPH_BASE}/me`);
  meUrl.searchParams.set("fields", "id,name");
  meUrl.searchParams.set("access_token", accessToken);

  const meRes = await fetch(meUrl.toString());
  const me = (await meRes.json()) as MetaMeResponse;

  if (!meRes.ok || me.error) {
    return {
      me: null,
      instagram: null,
      error: me.error?.message ?? "Meta kullanıcı bilgisi alınamadı.",
    };
  }

  const pagesUrl = new URL(`${META_OAUTH_GRAPH_BASE}/me/accounts`);
  pagesUrl.searchParams.set("fields", "name,instagram_business_account{id,username}");
  pagesUrl.searchParams.set("access_token", accessToken);

  const pagesRes = await fetch(pagesUrl.toString());
  const pagesJson = (await pagesRes.json()) as {
    data?: Array<{
      name?: string;
      instagram_business_account?: { id?: string; username?: string };
    }>;
    error?: { message?: string };
  };

  let instagram: MetaInstagramAccount | null = null;
  for (const page of pagesJson.data ?? []) {
    const ig = page.instagram_business_account;
    if (ig?.id && ig.username) {
      instagram = {
        pageName: page.name ?? "",
        instagramId: ig.id,
        username: ig.username,
      };
      break;
    }
  }

  if (metaDebugEnabled()) {
    console.log("[nexora.oauth.meta]", "profile", {
      meta_user_id: me.id,
      meta_name: me.name,
      instagram_username: instagram?.username ?? null,
    });
  }

  return { me, instagram, error: null };
}
