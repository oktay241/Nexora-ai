import { bufferLogGraphqlIssue } from "./buffer-log";
import { createBufferClient } from "./client";
import type { DashboardBufferChannel } from "@/types/database";
import type { ChannelId } from "./graphql-scalars";
import {
  parseChannelsData,
  parseCreatePostData,
  parseOrganizationsData,
  parsePostsConnectionData,
} from "./response-models";

const Q_ORGS = `
query NexoraBufferOrgs {
  account {
    organizations {
      id
      name
    }
  }
}
`;

const Q_CHANNELS = `
query NexoraBufferChannels($organizationId: OrganizationId!) {
  channels(input: { organizationId: $organizationId }) {
    id
    name
    service
    descriptor
    isDisconnected
    isLocked
  }
}
`;

const M_CREATE_QUEUED = `
mutation NexoraBufferCreateQueued($text: String!, $channelId: ChannelId!, $assets: [AssetInput!]!) {
  createPost(input: {
    text: $text
    channelId: $channelId
    schedulingType: automatic
    mode: addToQueue
    assets: $assets
  }) {
    __typename
    ... on PostActionSuccess {
      post {
        id
        text
        dueAt
        status
        channelId
      }
    }
    ... on MutationError {
      message
    }
  }
}
`;

const M_CREATE_SCHEDULED = `
mutation NexoraBufferCreateScheduled($text: String!, $channelId: ChannelId!, $dueAt: DateTime!, $assets: [AssetInput!]!) {
  createPost(input: {
    text: $text
    channelId: $channelId
    schedulingType: automatic
    mode: customScheduled
    dueAt: $dueAt
    assets: $assets
  }) {
    __typename
    ... on PostActionSuccess {
      post {
        id
        text
        dueAt
        status
        channelId
      }
    }
    ... on MutationError {
      message
    }
  }
}
`;

const Q_POSTS_PAGE = `
query NexoraBufferPostsPage(
  $organizationId: OrganizationId!
  $first: Int!
  $after: String
  $filter: PostsFiltersInput
) {
  posts(first: $first, after: $after, input: { organizationId: $organizationId, filter: $filter }) {
    edges {
      node {
        id
        status
        channelId
        dueAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

export type BufferOrganization = { id: string; name: string };

export async function bufferFetchOrganizations(
  accessToken: string,
): Promise<{ organizations: BufferOrganization[]; error: string | null }> {
  const c = createBufferClient(accessToken);
  const { data, errors } = await c.requestUnknown(Q_ORGS);
  if (errors?.length) {
    return { organizations: [], error: errors[0]!.message };
  }
  const orgs = parseOrganizationsData(data);
  return {
    organizations: orgs.map((o) => ({ id: String(o.id), name: o.name })),
    error: null,
  };
}

export async function bufferFetchChannels(
  accessToken: string,
  organizationId: string,
): Promise<{ channels: DashboardBufferChannel[]; error: string | null }> {
  const c = createBufferClient(accessToken);
  const { data, errors } = await c.requestUnknown(Q_CHANNELS, {
    organizationId,
  });
  if (errors?.length) {
    return { channels: [], error: errors[0]!.message };
  }
  return { channels: parseChannelsData(data), error: null };
}

export type BufferCreatedPost = {
  id: string;
  text: string;
  dueAt: string | null;
  status: string | null;
  channelId: string | null;
};

function mapCreatedPost(cp: NonNullable<ReturnType<typeof parseCreatePostData>>): BufferCreatedPost | null {
  const p = cp.post;
  if (!p?.id) return null;
  return {
    id: String(p.id),
    text: String(p.text ?? ""),
    dueAt: p.dueAt != null ? String(p.dueAt) : null,
    status: p.status != null ? String(p.status) : null,
    channelId: p.channelId != null ? String(p.channelId) : null,
  };
}

export async function bufferCreateQueuedPost(input: {
  accessToken: string;
  text: string;
  channelId: ChannelId | string;
  imageUrl?: string | null;
}): Promise<{ post: BufferCreatedPost | null; error: string | null }> {
  const c = createBufferClient(input.accessToken);
  const assets =
    input.imageUrl && input.imageUrl.length > 0
      ? [{ image: { url: input.imageUrl } }]
      : ([] as Array<{ image: { url: string } }>);

  const { data, errors, httpStatus, responseText } = await c.requestUnknown(M_CREATE_QUEUED, {
    text: input.text,
    channelId: input.channelId,
    assets,
  });
  if (errors?.length) {
    return { post: null, error: errors[0]!.message };
  }
  const cp = parseCreatePostData(data);
  if (!cp) {
    bufferLogGraphqlIssue({
      query: M_CREATE_QUEUED,
      httpStatus,
      errors: [{ message: "createPost: beklenmeyen veya boş data" }],
      responseText,
    });
    return { post: null, error: "Buffer createPost yanıtı çözümlenemedi." };
  }
  const post = mapCreatedPost(cp);
  if (post) return { post, error: null };

  const msg = typeof cp.message === "string" ? cp.message.trim() : "";
  if (msg) {
    bufferLogGraphqlIssue({
      query: M_CREATE_QUEUED,
      httpStatus,
      errors: [{ message: msg }],
      responseText,
    });
    return { post: null, error: msg };
  }

  bufferLogGraphqlIssue({
    query: M_CREATE_QUEUED,
    httpStatus,
    errors: [{ message: "createPost: post id yok; MutationError mesajı da yok" }],
    responseText,
  });
  return { post: null, error: "Buffer yanıtında post id yok." };
}

export async function bufferCreateCustomScheduledPost(input: {
  accessToken: string;
  text: string;
  channelId: ChannelId | string;
  dueAtIsoUtc: string;
  imageUrl?: string | null;
}): Promise<{ post: BufferCreatedPost | null; error: string | null }> {
  const c = createBufferClient(input.accessToken);
  const assets =
    input.imageUrl && input.imageUrl.length > 0
      ? [{ image: { url: input.imageUrl } }]
      : ([] as Array<{ image: { url: string } }>);

  const { data, errors, httpStatus, responseText } = await c.requestUnknown(M_CREATE_SCHEDULED, {
    text: input.text,
    channelId: input.channelId,
    dueAt: input.dueAtIsoUtc,
    assets,
  });
  if (errors?.length) {
    return { post: null, error: errors[0]!.message };
  }
  const cp = parseCreatePostData(data);
  if (!cp) {
    bufferLogGraphqlIssue({
      query: M_CREATE_SCHEDULED,
      httpStatus,
      errors: [{ message: "createPost: beklenmeyen veya boş data" }],
      responseText,
    });
    return { post: null, error: "Buffer createPost yanıtı çözümlenemedi." };
  }
  const post = mapCreatedPost(cp);
  if (post) return { post, error: null };

  const msg = typeof cp.message === "string" ? cp.message.trim() : "";
  if (msg) {
    bufferLogGraphqlIssue({
      query: M_CREATE_SCHEDULED,
      httpStatus,
      errors: [{ message: msg }],
      responseText,
    });
    return { post: null, error: msg };
  }

  bufferLogGraphqlIssue({
    query: M_CREATE_SCHEDULED,
    httpStatus,
    errors: [{ message: "createPost: post id yok; MutationError mesajı da yok" }],
    responseText,
  });
  return { post: null, error: "Buffer yanıtında post id yok." };
}

export type BufferPostNode = {
  id: string;
  status: string;
  channelId: string;
  dueAt: string | null;
};

export async function bufferFetchPostsPage(input: {
  accessToken: string;
  organizationId: string;
  first: number;
  after?: string | null;
  channelIds: string[];
  statuses: string[];
}): Promise<{
  nodes: BufferPostNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  error: string | null;
}> {
  const c = createBufferClient(input.accessToken);
  const filter: { channelIds?: string[]; status?: string[] } = {};
  if (input.channelIds.length) filter.channelIds = input.channelIds;
  if (input.statuses.length) filter.status = input.statuses;

  const { data, errors } = await c.requestUnknown(Q_POSTS_PAGE, {
    organizationId: input.organizationId,
    first: input.first,
    after: input.after ?? null,
    filter: Object.keys(filter).length ? filter : null,
  });
  if (errors?.length) {
    return { nodes: [], pageInfo: { hasNextPage: false, endCursor: null }, error: errors[0]!.message };
  }
  const parsed = parsePostsConnectionData(data);
  return {
    nodes: parsed.nodes,
    pageInfo: parsed.pageInfo,
    error: null,
  };
}
