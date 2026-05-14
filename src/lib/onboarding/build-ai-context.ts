import type { OnboardingContext, UserPersona } from "@/lib/onboarding/persona";

/** OpenAI kullanıcı mesajında kullanılacak yapılandırılmış özet (Türkçe). */
export function buildAiContextBlock(persona: UserPersona, ctx: OnboardingContext): string {
  const lines: string[] = [`Kullanıcı tipi: ${persona}`];

  const add = (label: string, key: string) => {
    const v = ctx[key]?.trim();
    if (v) lines.push(`${label}: ${v}`);
  };

  switch (persona) {
    case "ecommerce":
      add("Ürün / marka açıklaması", "product_description");
      add("Hedef müşteri kitlesi", "target_audience");
      add("Mağaza linki", "store_link");
      break;
    case "creator":
      add("İçerik kategorisi", "content_category");
      add("Niş alanı", "niche");
      add("Konuşma tarzı", "tone");
      add("Hedef platformlar", "target_platforms");
      add("Örnek içerik tarzı", "sample_style");
      break;
    case "personal_brand":
      add("Uzmanlık alanı", "expertise_area");
      add("Hedef kitle", "target_audience_pb");
      add("İçerik tonu", "content_tone");
      add("Paylaşım türü", "post_types");
      break;
    case "business":
      add("Sektör / iş kolu", "brand_sector");
      add("Yerel büyüme notu", "local_growth_note");
      add("Kampanya odağı", "campaign_angle");
      add("İletişim tonu", "content_tone_biz");
      break;
    default:
      break;
  }

  const extra = ctx.last_user_prompt?.trim();
  if (extra) {
    lines.push(`Ek kullanıcı notu (bu tur): ${extra}`);
  }

  return lines.join("\n");
}

export function mergeDescriptionForStorage(
  persona: UserPersona,
  ctx: OnboardingContext,
): string {
  const block = buildAiContextBlock(persona, ctx);
  return block.length > 4000 ? `${block.slice(0, 3997)}…` : block;
}
