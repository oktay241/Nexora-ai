/** Instagram / TikTok toggle’a göre kısa “AI neden bu format?” metni. */
export function buildAiFormatInsight(input: {
  platform: "instagram" | "tiktok";
  algorithmBehavior?: string | null;
  publishReason?: string | null;
  aiReasoning?: string | null;
}): string {
  const pick = (s: string | null | undefined, max: number) => {
    const t = String(s ?? "").trim();
    if (!t) return null;
    return t.length > max ? `${t.slice(0, max)}…` : t;
  };

  const fromAlgo = pick(input.algorithmBehavior, 160);
  if (fromAlgo) return fromAlgo;

  const fromReason = pick(input.publishReason, 160);
  if (fromReason) return fromReason;

  const fromAi = pick(input.aiReasoning, 160);
  if (fromAi) return fromAi;

  if (input.platform === "tiktok") {
    return "Dikey tam ekran + güçlü hook: TikTok FYP’de ilk 2 sn tutma ve loop sinyali için optimize edildi.";
  }
  return "Kare görsel + caption bloğu: Instagram feed’de kaydırma süresi ve carousel etkileşimi için uygundur.";
}
