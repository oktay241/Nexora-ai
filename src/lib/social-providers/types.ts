/**
 * Nexora yayın sağlayıcı soyutlaması.
 * Şu an üretim köprüsü Buffer GraphQL; ileride Meta / TikTok native sağlayıcıları eklenebilir.
 */

export type SocialPlatformId = "instagram" | "tiktok" | "linkedin" | "x";

export type ConnectedChannelView = {
  id: string;
  name: string;
  platform: SocialPlatformId | "other";
  descriptor: string;
  isDisconnected: boolean;
  isLocked: boolean;
};

export type PublishPipelineCounts = {
  linkedTotal: number;
  queueLikely: number;
  sent: number;
  errors: number;
};

export interface SocialPublishProvider {
  readonly key: "buffer" | "meta" | "tiktok_native";

  /** Sunucu tarafında kanal listesi (token org içi). */
  listExternalChannels(input: { accessToken: string; organizationId: string }): Promise<{
    channels: ConnectedChannelView[];
    error: string | null;
  }>;
}
