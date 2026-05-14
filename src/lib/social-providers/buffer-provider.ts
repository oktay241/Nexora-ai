import { bufferFetchChannels } from "@/lib/integrations/buffer/operations";

import type { ConnectedChannelView, SocialPublishProvider, SocialPlatformId } from "./types";

function mapService(service: string): SocialPlatformId | "other" {
  switch (service) {
    case "instagram":
      return "instagram";
    case "tiktok":
      return "tiktok";
    case "linkedin":
      return "linkedin";
    case "twitter":
      return "x";
    default:
      return "other";
  }
}

export const bufferPublishProvider: SocialPublishProvider = {
  key: "buffer",

  async listExternalChannels(input: { accessToken: string; organizationId: string }) {
    const r = await bufferFetchChannels(input.accessToken, input.organizationId);
    if (r.error) return { channels: [], error: r.error };
    const channels: ConnectedChannelView[] = r.channels.map((c) => ({
      id: c.id,
      name: c.name,
      platform: mapService(c.service),
      descriptor: c.descriptor,
      isDisconnected: c.isDisconnected,
      isLocked: c.isLocked,
    }));
    return { channels, error: null };
  },
};
