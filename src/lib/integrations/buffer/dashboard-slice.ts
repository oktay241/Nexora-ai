import { getBufferAccessToken } from "@/lib/env";
import type { DashboardBufferChannel, DashboardBufferSnapshot, ScheduledPostRow } from "@/types/database";

import { bufferFetchChannels, bufferFetchOrganizations } from "./operations";
import { isBufferSocialService } from "./platform-map";

export function buildBufferPipelineCounts(posts: ScheduledPostRow[]): DashboardBufferSnapshot["pipeline"] {
  const byPublishStatus: Record<string, number> = {};
  let bufferLinkedTotal = 0;
  for (const p of posts) {
    if (!p.buffer_post_id) continue;
    bufferLinkedTotal += 1;
    const st = (p.publish_status ?? "unknown").toLowerCase();
    byPublishStatus[st] = (byPublishStatus[st] ?? 0) + 1;
  }

  const queueLikely =
    (byPublishStatus["scheduled"] ?? 0) +
    (byPublishStatus["sending"] ?? 0) +
    (byPublishStatus["needs_approval"] ?? 0) +
    (byPublishStatus["draft"] ?? 0);

  return {
    bufferLinkedTotal,
    byPublishStatus,
    queueLikely,
    sent: byPublishStatus["sent"] ?? 0,
    errors: byPublishStatus["error"] ?? 0,
  };
}

export async function loadBufferDashboardSnapshot(
  scheduledPosts: ScheduledPostRow[],
): Promise<DashboardBufferSnapshot> {
  const token = getBufferAccessToken();
  const pipeline = buildBufferPipelineCounts(scheduledPosts);

  if (!token) {
    return {
      configured: false,
      error: null,
      organizations: [],
      channels: [],
      pipeline,
    };
  }

  const orgsR = await bufferFetchOrganizations(token);
  if (orgsR.error) {
    return {
      configured: true,
      error: orgsR.error,
      organizations: [],
      channels: [],
      pipeline,
    };
  }

  const orgId = orgsR.organizations[0]?.id;
  if (!orgId) {
    return {
      configured: true,
      error: "Yayın çalışma alanı bulunamadı.",
      organizations: orgsR.organizations,
      channels: [],
      pipeline,
    };
  }

  const chR = await bufferFetchChannels(token, orgId);
  const channels: DashboardBufferChannel[] = (chR.channels ?? []).filter((c) =>
    isBufferSocialService(c.service),
  );

  return {
    configured: true,
    error: chR.error,
    organizations: orgsR.organizations,
    channels,
    pipeline,
  };
}
