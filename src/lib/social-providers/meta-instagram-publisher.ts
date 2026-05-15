import { META_OAUTH_GRAPH_BASE } from "@/lib/integrations/meta/oauth";
import {
  metaErrorUserMessage,
  normalizeMetaApiError,
  parseMetaGraphErrorBody,
} from "@/lib/integrations/meta/meta-api-errors";

export type InstagramMediaContainerResult =
  | { ok: true; creationId: string }
  | { ok: false; error: string; kind: string };

export type InstagramPublishResult =
  | { ok: true; mediaId: string }
  | { ok: false; error: string; kind: string };

async function metaPostForm<T extends { id?: string }>(input: {
  path: string;
  accessToken: string;
  fields: Record<string, string>;
}): Promise<{ ok: true; data: T } | { ok: false; error: string; kind: string }> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(input.fields)) {
    body.set(k, v);
  }
  body.set("access_token", input.accessToken);

  const res = await fetch(`${META_OAUTH_GRAPH_BASE}/${input.path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const raw = await res.text();
  let json: T & { error?: { message?: string } } = {} as T & { error?: { message?: string } };
  try {
    json = raw ? (JSON.parse(raw) as T & { error?: { message?: string } }) : ({} as T);
  } catch {
    return { ok: false, error: "Meta yanıtı geçersiz JSON.", kind: "unknown" };
  }

  const parsed = parseMetaGraphErrorBody(raw);
  if (!res.ok || parsed?.error || json.error) {
    const norm = normalizeMetaApiError({ httpStatus: res.status, body: raw });
    return {
      ok: false,
      error: metaErrorUserMessage(norm),
      kind: norm.kind,
    };
  }

  return { ok: true, data: json };
}

/**
 * POST /{ig-user-id}/media
 */
export async function createInstagramMediaContainer(input: {
  instagramBusinessId: string;
  imageUrl: string;
  caption: string;
  accessToken: string;
}): Promise<InstagramMediaContainerResult> {
  const r = await metaPostForm<{ id?: string }>({
    path: `${input.instagramBusinessId}/media`,
    accessToken: input.accessToken,
    fields: {
      image_url: input.imageUrl,
      caption: input.caption.slice(0, 2200),
    },
  });

  if (!r.ok) return r;
  if (!r.data.id) {
    return { ok: false, error: "Media container oluşturuldu ancak id dönmedi.", kind: "unknown" };
  }
  return { ok: true, creationId: r.data.id };
}

/**
 * POST /{ig-user-id}/media_publish
 */
export async function publishInstagramMedia(input: {
  instagramBusinessId: string;
  creationId: string;
  accessToken: string;
}): Promise<InstagramPublishResult> {
  const r = await metaPostForm<{ id?: string }>({
    path: `${input.instagramBusinessId}/media_publish`,
    accessToken: input.accessToken,
    fields: {
      creation_id: input.creationId,
    },
  });

  if (!r.ok) return r;
  if (!r.data.id) {
    return { ok: false, error: "Yayın tamamlandı ancak media id dönmedi.", kind: "unknown" };
  }
  return { ok: true, mediaId: r.data.id };
}
