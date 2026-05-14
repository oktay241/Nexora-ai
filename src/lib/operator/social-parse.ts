/** Instagram / TikTok için görünen handle çıkarımı (MVP, regex). */
export function extractHandleFromInput(raw: string, platform: "instagram" | "tiktok"): string | null {
  const s = raw.trim();
  if (!s) return null;
  const at = s.match(/@([\w._]+)/);
  if (at?.[1]) return at[1].replace(/^@/, "");
  try {
    const u = s.startsWith("http") ? new URL(s) : new URL(`https://${s.replace(/^\/\//, "")}`);
    const path = u.pathname.replace(/^\//, "").replace(/\/$/, "");
    const parts = path.split("/").filter(Boolean);
    if (platform === "instagram") {
      const i = parts.findIndex((p) => p === "p" || p === "reel" || p === "stories");
      const user = i > 0 ? parts[i - 1] : parts[0];
      return user?.replace("@", "") ?? null;
    }
    if (parts[0] === "@" && parts[1]) return parts[1];
    return parts[0]?.replace("@", "") ?? null;
  } catch {
    return s.replace(/^@/, "").split("/")[0]?.trim() || null;
  }
}
