import type { SocialPublishProvider } from "./types";

export const tiktokNativePublishProvider: SocialPublishProvider = {
  key: "tiktok_native",

  async listExternalChannels() {
    return { channels: [], error: "TikTok native sağlayıcı henüz etkin değil." };
  },
};
