import { META_OAUTH_GRAPH_BASE } from "@/lib/integrations/meta/oauth";
import { normalizeMetaApiError, parseMetaGraphErrorBody } from "@/lib/integrations/meta/meta-api-errors";

export type DiscoveredInstagramBusinessAccount = {
  metaUserId: string;
  metaUserName: string | null;
  metaPageId: string;
  metaPageName: string;
  instagramBusinessId: string;
  username: string;
  accountType: string | null;
};

type GraphListResponse<T> = {
  data?: T[];
  error?: { message?: string; type?: string; code?: number };
};

async function graphGet<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const res = await fetch(url);
  const raw = await res.text();
  let json: T & { error?: { message?: string } } = {} as T & { error?: { message?: string } };
  try {
    json = raw ? (JSON.parse(raw) as T & { error?: { message?: string } }) : ({} as T);
  } catch {
    return { ok: false, error: "Meta Graph yanıtı geçersiz." };
  }
  const parsed = parseMetaGraphErrorBody(raw);
  if (!res.ok || parsed?.error || json.error) {
    const norm = normalizeMetaApiError({ httpStatus: res.status, body: raw });
    return { ok: false, error: norm.message };
  }
  return { ok: true, data: json };
}

/**
 * OAuth sonrası: /me, /me/accounts, instagram_business_account + account_type.
 */
export async function discoverInstagramBusinessAccount(accessToken: string): Promise<{
  account: DiscoveredInstagramBusinessAccount | null;
  error: string | null;
}> {
  const meUrl = new URL(`${META_OAUTH_GRAPH_BASE}/me`);
  meUrl.searchParams.set("fields", "id,name");
  meUrl.searchParams.set("access_token", accessToken);

  const meR = await graphGet<{ id?: string; name?: string }>(meUrl.toString());
  if (!meR.ok) return { account: null, error: meR.error };
  if (!meR.data.id) return { account: null, error: "Meta kullanıcı kimliği alınamadı." };

  const pagesUrl = new URL(`${META_OAUTH_GRAPH_BASE}/me/accounts`);
  pagesUrl.searchParams.set(
    "fields",
    "id,name,instagram_business_account{id,username}",
  );
  pagesUrl.searchParams.set("access_token", accessToken);

  const pagesR = await graphGet<GraphListResponse<{
    id?: string;
    name?: string;
    instagram_business_account?: { id?: string; username?: string };
  }>>(pagesUrl.toString());

  if (!pagesR.ok) return { account: null, error: pagesR.error };

  let pageHit: {
    id: string;
    name: string;
    ig: { id: string; username: string };
  } | null = null;

  for (const page of pagesR.data.data ?? []) {
    const ig = page.instagram_business_account;
    if (page.id && ig?.id && ig.username) {
      pageHit = {
        id: page.id,
        name: page.name ?? "",
        ig: { id: ig.id, username: ig.username },
      };
      break;
    }
  }

  if (!pageHit) {
    return { account: null, error: null };
  }

  const igDetailUrl = new URL(`${META_OAUTH_GRAPH_BASE}/${pageHit.ig.id}`);
  igDetailUrl.searchParams.set("fields", "username,account_type");
  igDetailUrl.searchParams.set("access_token", accessToken);

  const igR = await graphGet<{ username?: string; account_type?: string }>(igDetailUrl.toString());
  const accountType = igR.ok ? (igR.data.account_type ?? null) : null;

  return {
    account: {
      metaUserId: meR.data.id,
      metaUserName: meR.data.name ?? null,
      metaPageId: pageHit.id,
      metaPageName: pageHit.name,
      instagramBusinessId: pageHit.ig.id,
      username: pageHit.ig.username,
      accountType,
    },
    error: null,
  };
}

export function isInstagramProfessionalAccount(accountType: string | null): boolean {
  if (!accountType) return false;
  const t = accountType.toUpperCase();
  return t === "BUSINESS" || t === "MEDIA_CREATOR" || t === "CREATOR";
}
