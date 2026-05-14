import type { SocialPublishProvider } from "./types";

export const metaPublishProvider: SocialPublishProvider = {
  key: "meta",

  async listExternalChannels() {
    return { channels: [], error: "Meta native sağlayıcı henüz etkin değil." };
  },
};
