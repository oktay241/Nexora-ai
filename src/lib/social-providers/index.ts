import { bufferPublishProvider } from "./buffer-provider";
import { metaPublishProvider } from "./meta-provider";
import { tiktokNativePublishProvider } from "./tiktok-provider";
import type { SocialPublishProvider } from "./types";

export type PublishBridgeKey = "buffer" | "meta" | "tiktok_native";

function readBridgeKey(): PublishBridgeKey {
  const raw = (process.env.NEXORA_PUBLISH_BRIDGE ?? "buffer").trim().toLowerCase();
  if (raw === "meta") return "meta";
  if (raw === "tiktok_native" || raw === "tiktok") return "tiktok_native";
  return "buffer";
}

export function getActivePublishProvider(): SocialPublishProvider {
  switch (readBridgeKey()) {
    case "meta":
      return metaPublishProvider;
    case "tiktok_native":
      return tiktokNativePublishProvider;
    default:
      return bufferPublishProvider;
  }
}

export * from "./types";
export { bufferPublishProvider } from "./buffer-provider";
