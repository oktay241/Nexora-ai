import type { CreativeEnginePayload } from "@/lib/openai/creative-engine";

function clusterFromHashtags(tags: string[]): string[] {
  if (tags.length === 0) return [];
  const a = tags.slice(0, 5).join(" ");
  const b = tags.slice(5, 10).join(" ");
  const c = tags.slice(10, 14).join(" ");
  return [a, b, c].filter((s) => s.length > 0);
}

export function parseCreativePack(raw: unknown): CreativeEnginePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const hashtags = Array.isArray(o.hashtags)
    ? o.hashtags.map((h) => String(h).trim()).filter(Boolean)
    : [];
  const strArr = (k: string, max = 8) =>
    Array.isArray(o[k]) ? (o[k] as unknown[]).map((x) => String(x).trim()).filter(Boolean).slice(0, max) : [];
  const caption = String(o.caption ?? "").trim();
  if (!caption || hashtags.length === 0) return null;

  const clusters = strArr("hashtagClusters", 6);
  const hashtagClusters = clusters.length ? clusters : clusterFromHashtags(hashtags);
  const creativeStrategy = String(o.creativeStrategy ?? "").trim();
  const publishingStrategy = String(o.publishingStrategy ?? creativeStrategy ?? "").trim();
  const publishReason = String(o.publishReason ?? "").trim();
  const aiReasoning = (() => {
    const direct = String(o.aiReasoning ?? "").trim();
    if (direct) return direct;
    const merged = [creativeStrategy, publishReason].filter(Boolean).join(" ");
    return merged.trim() || "Niş ve hedefe göre bu turda maksimum keşfedilebilirlik için seçildi.";
  })();

  return {
    caption,
    hashtags,
    hashtagClusters,
    publishingStrategy,
    algorithmBehaviorTarget:
      String(o.algorithmBehaviorTarget ?? "").trim() ||
      "Keşfet / FYP: ilk 3 sn tutma, loop ve kaydet sinyali; yorum tetikleyici CTA.",
    imageVisualBrief: String(o.imageVisualBrief ?? "").trim(),
    contentIdea: String(o.contentIdea ?? "").trim(),
    shortVideoIdea: String(o.shortVideoIdea ?? "").trim(),
    viralIdeas: strArr("viralIdeas"),
    videoConcepts: strArr("videoConcepts"),
    hooks: strArr("hooks"),
    ctas: strArr("ctas"),
    carouselIdeas: strArr("carouselIdeas"),
    ugcScenarios: strArr("ugcScenarios"),
    reelsConcepts: strArr("reelsConcepts"),
    adCreativeIdeas: strArr("adCreativeIdeas"),
    ugcVideoIdeas: strArr("ugcVideoIdeas"),
    salesHooks: strArr("salesHooks"),
    shortAdScripts: strArr("shortAdScripts"),
    viralHookPrimary: String(o.viralHookPrimary ?? strArr("hooks", 1)[0] ?? "").trim(),
    reelsScenario: String(o.reelsScenario ?? "").trim(),
    trendAlignedContent: strArr("trendAlignedContent"),
    ugcAdIdeas: strArr("ugcAdIdeas"),
    publishingConcepts: strArr("publishingConcepts"),
    creativeStrategy,
    publishReason,
    aiReasoning,
  };
}

/** creative_pack satırda caption/hashtag tekrarlamıyorsa tablo alanlarından birleştirir. */
export function parseCreativePackFromRow(
  creative_pack: unknown,
  caption: string,
  hashtags: string[],
): CreativeEnginePayload | null {
  const cap = String(caption ?? "").trim();
  const tags = (hashtags ?? []).map((h) => String(h).trim()).filter(Boolean);
  if (!cap || tags.length === 0) return null;

  const base =
    creative_pack && typeof creative_pack === "object" && !Array.isArray(creative_pack)
      ? { ...(creative_pack as Record<string, unknown>) }
      : {};

  return parseCreativePack({
    ...base,
    caption: String(base.caption ?? cap).trim(),
    hashtags:
      Array.isArray(base.hashtags) && (base.hashtags as unknown[]).length > 0
        ? (base.hashtags as unknown[]).map((x) => String(x).trim()).filter(Boolean)
        : tags,
  });
}
