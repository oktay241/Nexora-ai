import type { OnboardingContext, UserPersona } from "@/lib/onboarding/persona";

const REQ: Record<UserPersona, string[]> = {
  ecommerce: ["product_description", "target_audience", "store_link"],
  creator: ["content_category", "niche", "tone", "target_platforms", "sample_style"],
  personal_brand: ["expertise_area", "target_audience_pb", "content_tone", "post_types"],
  business: ["brand_sector", "campaign_angle", "content_tone_biz"],
};

const LABELS: Record<string, string> = {
  product_description: "Ürün açıklaması",
  target_audience: "Hedef müşteri kitlesi",
  store_link: "Mağaza linki",
  content_category: "İçerik kategorisi",
  niche: "Niş alanı",
  tone: "Konuşma tarzı",
  target_platforms: "Hedef platformlar",
  sample_style: "Örnek içerik tarzı",
  expertise_area: "Uzmanlık alanı",
  target_audience_pb: "Hedef kitle",
  content_tone: "İçerik tonu",
  post_types: "Paylaşım türü",
  brand_sector: "Sektör / iş kolu",
  local_growth_note: "Yerel büyüme notu",
  campaign_angle: "Kampanya odağı",
  content_tone_biz: "İletişim tonu",
};

export function validateOnboardingContext(
  persona: UserPersona,
  ctx: OnboardingContext,
): string | null {
  for (const key of REQ[persona]) {
    if (!ctx[key]?.trim()) {
      return `${LABELS[key] ?? key} alanı zorunludur.`;
    }
  }
  if (persona === "ecommerce") {
    const link = ctx.store_link?.trim() ?? "";
    if (link && !/^https?:\/\//i.test(link)) {
      return "Mağaza linki http veya https ile başlamalıdır.";
    }
  }
  return null;
}

export type ParsedContext =
  | { ok: true; ctx: OnboardingContext }
  | { ok: false; error: string };

export function parseContextJson(raw: string): ParsedContext {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      return { ok: false, error: "Geçersiz profil verisi." };
    }
    const out: OnboardingContext = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = String(val ?? "").trim();
    }
    return { ok: true, ctx: out };
  } catch {
    return { ok: false, error: "Profil verisi okunamadı." };
  }
}
