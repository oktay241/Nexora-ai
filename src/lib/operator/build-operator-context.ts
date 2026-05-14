import type { DiscoveryProfile, GrowthStrategyPayload } from "@/lib/operator/discovery-types";
import type { UserPersona } from "@/lib/onboarding/persona";

function safeDiscovery(raw: unknown): Partial<DiscoveryProfile> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Partial<DiscoveryProfile>;
}

function safeGrowth(raw: unknown): Partial<GrowthStrategyPayload> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Partial<GrowthStrategyPayload>;
}

/** Creative Engine ve diğer AI çağrıları için operatör bağlamı (Türkçe). */
export function buildOperatorContextBlock(
  persona: UserPersona,
  discovery: unknown,
  growth: unknown,
  extras: { bioNote?: string; instagram?: string; tiktok?: string; goal?: string; usageMode?: string },
): string {
  const d = safeDiscovery(discovery);
  const g = safeGrowth(growth);
  const lines: string[] = [`Nexora modu: Tam otonom growth operatörü`, `Kullanıcı tipi (persona): ${persona}`];

  if (extras.usageMode) lines.push(`Kullanım modu: ${extras.usageMode}`);
  if (extras.goal) lines.push(`Büyüme hedefi: ${extras.goal}`);
  if (extras.instagram) lines.push(`Instagram girdisi: ${extras.instagram}`);
  if (extras.tiktok) lines.push(`TikTok girdisi: ${extras.tiktok}`);
  if (extras.bioNote) lines.push(`Kullanıcı bio notu:\n${extras.bioNote}`);

  if (d.bio_analysis) lines.push(`Bio analizi:\n${d.bio_analysis}`);
  if (d.profile_structure_summary) lines.push(`Profil yapısı:\n${d.profile_structure_summary}`);
  if (d.inferred_content_category) lines.push(`Tahmini içerik kategorisi: ${d.inferred_content_category}`);
  if (d.account_type) lines.push(`Hesap tipi sınıfı: ${d.account_type}`);
  if (d.niche) lines.push(`Niş: ${d.niche}`);
  if (d.tone) lines.push(`Ton: ${d.tone}`);
  if (d.posting_style) lines.push(`Paylaşım tarzı: ${d.posting_style}`);
  if (d.target_audience) lines.push(`Hedef kitle (tahmin): ${d.target_audience}`);
  if (d.content_formats?.length) lines.push(`İçerik formatları: ${d.content_formats.join(", ")}`);
  if (d.engagement_pattern_hint) lines.push(`Etkileşim paterni ipucu: ${d.engagement_pattern_hint}`);

  if (g.strategy_summary) lines.push(`AI strateji özeti:\n${g.strategy_summary}`);
  if (g.posting_frequency) lines.push(`Önerilen paylaşım sıklığı: ${g.posting_frequency}`);
  if (g.best_content_types?.length) lines.push(`Öncelikli içerik tipleri: ${g.best_content_types.join(", ")}`);
  if (g.recommended_hook_style) lines.push(`Önerilen hook stili: ${g.recommended_hook_style}`);
  if (g.viral_hook_strategy?.length) lines.push(`Viral hook stratejisi: ${g.viral_hook_strategy.join(" | ")}`);
  if (g.platform_strategy) lines.push(`Platform stratejisi: ${g.platform_strategy}`);
  if (g.viral_content_structure) lines.push(`Viral içerik yapısı: ${g.viral_content_structure}`);
  if (g.content_pillars?.length) lines.push(`İçerik sütunları: ${g.content_pillars.join(" | ")}`);
  if (g.best_posting_times?.length) lines.push(`Önerilen zamanlar: ${g.best_posting_times.join(", ")}`);
  if (g.engagement_optimization) lines.push(`Etkileşim optimizasyonu: ${g.engagement_optimization}`);
  if (g.next_experiment_hook) lines.push(`Test edilecek sonraki hook: ${g.next_experiment_hook}`);
  if (g.why_this_direction) lines.push(`Strateji gerekçesi: ${g.why_this_direction}`);

  const block = lines.join("\n");
  return block.length > 6000 ? `${block.slice(0, 5997)}…` : block;
}
