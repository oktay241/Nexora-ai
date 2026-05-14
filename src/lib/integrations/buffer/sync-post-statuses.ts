import type { SupabaseClient } from "@supabase/supabase-js";

import { bufferFetchOrganizations, bufferFetchPostsPage } from "./operations";

const SYNC_STATUSES = [
  "draft",
  "needs_approval",
  "scheduled",
  "sending",
  "sent",
  "error",
] as const;

const MAX_PAGES = 6;
const PAGE_SIZE = 40;

/**
 * Buffer’daki güncel post durumlarını çekip `scheduled_posts.publish_status` alanını günceller.
 * Tam eşleşme için buffer_post_id kullanılır; sayfalama üst sınırı vardır.
 */
export async function syncBufferPublishStatusesForUser(input: {
  supabase: SupabaseClient;
  userId: string;
  accessToken: string;
  timeoutMs?: number;
}): Promise<{ updated: number; error: string | null }> {
  const deadline = Date.now() + (input.timeoutMs ?? 4500);

  const orgRes = await bufferFetchOrganizations(input.accessToken);
  if (orgRes.error) return { updated: 0, error: orgRes.error };
  const orgId = orgRes.organizations[0]?.id;
  if (!orgId) return { updated: 0, error: "Yayın çalışma alanı bulunamadı." };

  const { data: rows, error: rErr } = await input.supabase
    .from("scheduled_posts")
    .select("id, buffer_post_id, buffer_channel_id, publish_status")
    .eq("user_id", input.userId)
    .not("buffer_post_id", "is", null);

  if (rErr) return { updated: 0, error: rErr.message };

  const targets = (rows ?? []) as Array<{
    id: string;
    buffer_post_id: string | null;
    buffer_channel_id: string | null;
    publish_status: string | null;
  }>;

  if (targets.length === 0) return { updated: 0, error: null };

  const wanted = new Map<string, { rowId: string; current: string | null }>();
  for (const t of targets) {
    const bid = t.buffer_post_id;
    if (!bid) continue;
    wanted.set(bid, { rowId: t.id, current: t.publish_status ?? null });
  }

  const channelIds = [
    ...new Set(
      targets.map((t) => t.buffer_channel_id).filter((x): x is string => Boolean(x && x.length)),
    ),
  ];

  if (channelIds.length === 0) {
    return { updated: 0, error: "Yayın eşlemesi için kanal kimliği eksik." };
  }

  const statusByPostId = new Map<string, string>();
  let after: string | null = null;
  let page = 0;

  while (page < MAX_PAGES && Date.now() < deadline) {
    page += 1;
    const { nodes, pageInfo, error } = await bufferFetchPostsPage({
      accessToken: input.accessToken,
      organizationId: orgId,
      first: PAGE_SIZE,
      after,
      channelIds,
      statuses: [...SYNC_STATUSES],
    });
    if (error) return { updated: 0, error };

    for (const n of nodes) {
      if (wanted.has(n.id)) statusByPostId.set(n.id, n.status);
    }

    let allFound = true;
    for (const id of wanted.keys()) {
      if (!statusByPostId.has(id)) {
        allFound = false;
        break;
      }
    }
    if (allFound) break;

    if (!pageInfo.hasNextPage || !pageInfo.endCursor) break;
    after = pageInfo.endCursor;
  }

  let updated = 0;
  for (const [postId, status] of statusByPostId) {
    const meta = wanted.get(postId);
    if (!meta) continue;
    if (meta.current === status) continue;
    const { error: uErr } = await input.supabase
      .from("scheduled_posts")
      .update({ publish_status: status })
      .eq("id", meta.rowId)
      .eq("user_id", input.userId);
    if (!uErr) updated += 1;
  }

  return { updated, error: null };
}
