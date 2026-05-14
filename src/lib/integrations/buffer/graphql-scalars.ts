/**
 * Buffer GraphQL özel scalar’ları — çalışma zamanında string; tip güvenliği için markalı alias.
 * @see https://developers.buffer.com/guides/data-model.html
 */

declare const __brand: unique symbol;

export type OrganizationId = string & { readonly [__brand]?: "OrganizationId" };
export type ChannelId = string & { readonly [__brand]?: "ChannelId" };
export type PostId = string & { readonly [__brand]?: "PostId" };
export type ProfileId = string & { readonly [__brand]?: "ProfileId" };

export function asOrganizationId(id: string): OrganizationId {
  return id as OrganizationId;
}

export function asChannelId(id: string): ChannelId {
  return id as ChannelId;
}

export function asPostId(id: string): PostId {
  return id as PostId;
}
