/** AI Discovery Engine — JSON şeması (OpenAI ile uyumlu). */
export type DiscoveryProfile = {
  bio_analysis: string;
  /** Profil bölümleri / linkler / CTA yapısı özeti. */
  profile_structure_summary: string;
  inferred_content_category: string;
  account_type: string;
  niche: string;
  tone: string;
  /** Paylaşım ritmi ve üslup (Reels ağırlıklı mı, carousel mi vb.). */
  posting_style: string;
  /** Hedef kitle tahmini. */
  target_audience: string;
  content_formats: string[];
  engagement_pattern_hint: string;
  growth_score: number;
  viral_potential: number;
  confidence: number;
};

/** AI Growth Strategy — JSON şeması (Strategy Layer). */
export type GrowthStrategyPayload = {
  /** Kısa AI strateji özeti (dashboard). */
  strategy_summary: string;
  posting_frequency: string;
  best_content_types: string[];
  recommended_hook_style: string;
  /** Viral hook stratejisi (dizi veya tema). */
  viral_hook_strategy: string[];
  platform_strategy: string;
  viral_content_structure: string;
  content_pillars: string[];
  /** Önerilen paylaşım zamanları (TR saati veya göreceli). */
  best_posting_times: string[];
  /** Etkileşim optimizasyonu notları. */
  engagement_optimization: string;
  operator_loop_summary: string;
  next_experiment_hook: string;
  why_this_direction: string;
};

export type UsageMode = "full_auto" | "approval_required";

export function isUsageMode(v: string): v is UsageMode {
  return v === "full_auto" || v === "approval_required";
}
