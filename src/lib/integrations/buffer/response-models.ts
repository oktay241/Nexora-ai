import type { DashboardBufferChannel } from "@/types/database";

import { asOrganizationId, type OrganizationId } from "./graphql-scalars";

/** Ham GraphQL `data` ağacı — yalnızca iç ayrıştırma için. */
export type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function readString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export type BufferOrganizationModel = {
  id: OrganizationId;
  name: string;
};

export function parseOrganizationsData(data: unknown): BufferOrganizationModel[] {
  if (!isRecord(data)) return [];
  const account = data.account;
  if (!isRecord(account)) return [];
  const orgs = account.organizations;
  if (!Array.isArray(orgs)) return [];
  const out: BufferOrganizationModel[] = [];
  for (const o of orgs) {
    if (!isRecord(o)) continue;
    const id = readString(o.id);
    if (!id) continue;
    out.push({ id: asOrganizationId(id), name: readString(o.name) ?? "" });
  }
  return out;
}

export function parseChannelsData(data: unknown): DashboardBufferChannel[] {
  if (!isRecord(data)) return [];
  const chs = data.channels;
  if (!Array.isArray(chs)) return [];
  const out: DashboardBufferChannel[] = [];
  for (const c of chs) {
    if (!isRecord(c)) continue;
    const id = readString(c.id);
    if (!id) continue;
    out.push({
      id,
      name: readString(c.name) ?? "",
      service: readString(c.service) ?? "",
      descriptor: readString(c.descriptor) ?? "",
      isDisconnected: Boolean(c.isDisconnected),
      isLocked: Boolean(c.isLocked),
    });
  }
  return out;
}

export type BufferPostNodeModel = {
  id: string;
  status: string;
  channelId: string;
  dueAt: string | null;
};

export function parsePostsConnectionData(data: unknown): {
  nodes: BufferPostNodeModel[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
} {
  if (!isRecord(data)) return { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
  const posts = data.posts;
  if (!isRecord(posts)) return { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
  const edges = posts.edges;
  const pageInfoRaw = posts.pageInfo;
  const pageInfo = isRecord(pageInfoRaw)
    ? {
        hasNextPage: Boolean(pageInfoRaw.hasNextPage),
        endCursor: readString(pageInfoRaw.endCursor),
      }
    : { hasNextPage: false, endCursor: null };

  if (!Array.isArray(edges)) return { nodes: [], pageInfo };

  const nodes: BufferPostNodeModel[] = [];
  for (const e of edges) {
    if (!isRecord(e)) continue;
    const n = e.node;
    if (!isRecord(n)) continue;
    const id = readString(n.id);
    if (!id) continue;
    nodes.push({
      id,
      status: readString(n.status) ?? "",
      channelId: readString(n.channelId) ?? "",
      dueAt: n.dueAt != null && typeof n.dueAt === "string" ? n.dueAt : null,
    });
  }
  return { nodes, pageInfo };
}

export type BufferCreatePostPayload = {
  __typename?: string;
  message?: string;
  post?: {
    id?: string;
    text?: string;
    dueAt?: string | null;
    status?: string | null;
    channelId?: string | null;
  };
};

export function parseCreatePostData(data: unknown): BufferCreatePostPayload | null {
  if (!isRecord(data)) return null;
  const cp = data.createPost;
  if (!isRecord(cp)) return null;
  return cp as BufferCreatePostPayload;
}
