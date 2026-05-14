import OpenAI from "openai";

import { getOpenAIApiKey, getOpenAIModel } from "@/lib/env";
import type { UserPersona } from "@/lib/onboarding/persona";

export type CreativeEnginePayload = {
  caption: string;
  hashtags: string[];
  /** Hashtag kümeleri (satır başına bir küme veya virgülle ayrılmış). */
  hashtagClusters: string[];
  /** Yayın / dağıtım stratejisi (platform ve sıra). */
  publishingStrategy: string;
  /** Hedef algoritma davranışı (keşfet, FYP, kaydet vb.). */
  algorithmBehaviorTarget: string;
  /** Görsel üretimi için İngilizce kısa görsel brief (DALL-E). */
  imageVisualBrief: string;
  contentIdea: string;
  shortVideoIdea: string;
  viralIdeas: string[];
  videoConcepts: string[];
  hooks: string[];
  ctas: string[];
  carouselIdeas: string[];
  ugcScenarios: string[];
  reelsConcepts: string[];
  adCreativeIdeas: string[];
  ugcVideoIdeas: string[];
  salesHooks: string[];
  shortAdScripts: string[];
  /** Tek vurgulu viral hook (özet). */
  viralHookPrimary: string;
  /** Reels için sahne sahne kısa senaryo. */
  reelsScenario: string;
  /** Trend / ses / konu uyumu. */
  trendAlignedContent: string[];
  /** UGC reklam / testimonial fikirleri. */
  ugcAdIdeas: string[];
  /** Yayın öncesi konsept (başlık + görsel + CTA). */
  publishingConcepts: string[];
  /** Bu tur için yaratıcı strateji özeti (1–3 cümle). */
  creativeStrategy: string;
  /** Bu içeriğin seçilme gerekçesi. */
  publishReason: string;
  /** Operatör / dashboard için birleşik AI gerekçe (strateji + algoritma + niş bağlantısı). */
  aiReasoning: string;
};

function strArr(v: unknown, max = 8): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean).slice(0, max);
}

function systemPrompt(persona: UserPersona, hasProductImage: boolean): string {
  const base = `Sen "Nexora AI Creative Engine"sin — tam otonom sosyal medya growth operatörünün üretim katmanısın.
Premium Türkçe; yanıtı YALNIZCA geçerli bir JSON nesnesi olarak ver; başka metin ekleme.
Tüm metinler Türkçe olsun; kısa, net ve uygulanabilir olsun.`;

  const schemaCommon = `
Şema (tüm alanlar dizi veya string; boş bırakma yerine kısa öğeler üret):
{
  "caption": "string (~600-900 karakter, yayına hazır)",
  "hashtags": ["#...", ...]  // 10-14 adet, tekrarsız,
  "contentIdea": "string — ana akış gönderisi fikri (tek paragraf)",
  "shortVideoIdea": "string — 20-40 sn video kurgusu (sahne sahne çok kısa)",
  "viralIdeas": ["string", ...]  // 4-6 fikir,
  "videoConcepts": ["string", ...]  // 3-5 konsept,
  "hooks": ["string", ...]  // 5-8 ilk cümle / thumb-stop hook,
  "ctas": ["string", ...]  // 4-6 harekete geçirici,
  "carouselIdeas": ["string", ...]  // 3-5 slayt akışı,
  "ugcScenarios": ["string", ...]  // 3-5 UGC senaryosu (kim ne çeker),
  "reelsConcepts": ["string", ...]  // 4-6 Reels konsepti,
  "adCreativeIdeas": ["string", ...],
  "ugcVideoIdeas": ["string", ...],
  "salesHooks": ["string", ...],
  "shortAdScripts": ["string", ...],
  "viralHookPrimary": "string — tek cümlede en güçlü viral hook",
  "reelsScenario": "string — Reels için 4-6 sahneli kısa senaryo (numaralı)",
  "trendAlignedContent": ["string", ...]  // 3-5 trend / ses / konu uyumu fikri,
  "ugcAdIdeas": ["string", ...]  // 3-5 UGC reklam / testimonial fikri,
  "publishingConcepts": ["string", ...]  // 3-4 yayın öncesi konsept (görsel + mesaj),
  "creativeStrategy": "string — bu turun yaratıcı stratejisi (2-4 cümle)",
  "publishReason": "string — bu içeriğin neden seçildiği (2-3 cümle)",
  "aiReasoning": "string — operatör özeti: niş + hedef + algoritma + risk/ödül (3-5 cümle, Türkçe)",
  "hashtagClusters": ["string", ...]  // 2-4 küme; her string 4-7 hashtag içerebilir,
  "publishingStrategy": "string — hangi formatta, hangi sırada, hangi CTA ile yayın",
  "algorithmBehaviorTarget": "string — hedef platform algoritması için optimizasyon (Reels watch time, TikTok FYP loop, kaydet vb.)",
  "imageVisualBrief": "string — İngilizce, tek paragraf: premium sosyal görsel için DALL-E prompt (no text in image, cinematic lighting, 1:1 social post aesthetic)"
}`;

  if (persona === "ecommerce" && hasProductImage) {
    return `${base}
Kullanıcı ürün satan marka. Görseli analiz et: renk, ürün türü, fayda vaadi, hedef kitle ipuçları.
${schemaCommon}
"adCreativeIdeas", "ugcVideoIdeas", "salesHooks", "shortAdScripts" alanlarını özellikle doldur (reklam görseli fikirleri, UGC video fikirleri, satış hook'ları, 15-30 sn kısa reklam senaryoları).
Diğer alanlar da dolu olsun.`;
  }

  if (persona === "ecommerce") {
    return `${base}
Kullanıcı ürün satan marka (görsel olmayabilir). Metinden ürünü tahmin et ve yine e-ticaret odaklı doldur.
${schemaCommon}
adCreativeIdeas, ugcVideoIdeas, salesHooks, shortAdScripts dolu olsun.`;
  }

  if (persona === "creator") {
    return `${base}
Kullanıcı içerik üreticisi: trend, hook, Reels ve viral odak.
${schemaCommon}
E-ticaret özel alanlarını da doldur ama daha genel / marka işbirliği tonunda tut (boş dizi verme).`;
  }

  if (persona === "personal_brand") {
    return `${base}
Kullanıcı kişisel marka: otorite, güven, eğitim/insight içeriği.
${schemaCommon}`;
  }

  return `${base}
Kullanıcı işletme: yerel görünürlük, kampanya ve marka iletişimi.
${schemaCommon}`;
}

export async function generateCreativeEngine(input: {
  persona: UserPersona;
  goal: string;
  contextBlock: string;
  imageSignedUrl?: string | null;
}): Promise<CreativeEnginePayload> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY tanımlı değil.");

  const openai = new OpenAI({ apiKey });
  const model = getOpenAIModel();
  const hasImg = Boolean(input.imageSignedUrl);
  const system = systemPrompt(input.persona, hasImg);

  const userParts: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Hedef: ${input.goal}\n\nKullanıcı bağlamı:\n${input.contextBlock}`,
    },
  ];

  if (input.imageSignedUrl) {
    userParts.push({
      type: "image_url",
      image_url: { url: input.imageSignedUrl, detail: "low" },
    });
  }

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: userParts },
    ],
    temperature: 0.78,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI yanıtı boş.");

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const caption = String(parsed.caption ?? "").trim();
  const hashtags = strArr(parsed.hashtags, 16);
  const contentIdea = String(parsed.contentIdea ?? "").trim();
  const shortVideoIdea = String(parsed.shortVideoIdea ?? "").trim();

  if (!caption || hashtags.length === 0) {
    throw new Error("Model çıktısı eksik (caption veya hashtag).");
  }

  return {
    caption,
    hashtags,
    hashtagClusters: strArr(parsed.hashtagClusters, 6).length
      ? strArr(parsed.hashtagClusters, 6)
      : [hashtags.slice(0, 5).join(" "), hashtags.slice(5, 10).join(" ")].filter(Boolean),
    publishingStrategy: String(parsed.publishingStrategy ?? parsed.creativeStrategy ?? "").trim(),
    algorithmBehaviorTarget:
      String(parsed.algorithmBehaviorTarget ?? "").trim() ||
      "Keşfet / FYP: ilk 3 sn tutma, loop ve kaydet sinyali; yorum tetikleyici CTA.",
    imageVisualBrief:
      String(parsed.imageVisualBrief ?? "").trim() ||
      "Premium futuristic social visual, cinematic lighting, dark mode aesthetic, square 1:1, no text.",
    contentIdea,
    shortVideoIdea,
    viralIdeas: strArr(parsed.viralIdeas, 8),
    videoConcepts: strArr(parsed.videoConcepts, 8),
    hooks: strArr(parsed.hooks, 10),
    ctas: strArr(parsed.ctas, 8),
    carouselIdeas: strArr(parsed.carouselIdeas, 8),
    ugcScenarios: strArr(parsed.ugcScenarios, 8),
    reelsConcepts: strArr(parsed.reelsConcepts, 8),
    adCreativeIdeas: strArr(parsed.adCreativeIdeas, 8),
    ugcVideoIdeas: strArr(parsed.ugcVideoIdeas, 8),
    salesHooks: strArr(parsed.salesHooks, 10),
    shortAdScripts: strArr(parsed.shortAdScripts, 6),
    viralHookPrimary: String(parsed.viralHookPrimary ?? strArr(parsed.hooks, 1)[0] ?? "").trim(),
    reelsScenario: String(parsed.reelsScenario ?? "").trim(),
    trendAlignedContent: strArr(parsed.trendAlignedContent, 8),
    ugcAdIdeas: strArr(parsed.ugcAdIdeas, 8),
    publishingConcepts: strArr(parsed.publishingConcepts, 6),
    creativeStrategy: String(parsed.creativeStrategy ?? "").trim(),
    publishReason: String(parsed.publishReason ?? "").trim(),
    aiReasoning: (() => {
      const direct = String(parsed.aiReasoning ?? "").trim();
      if (direct) return direct;
      const strat = String(parsed.creativeStrategy ?? "").trim();
      const reason = String(parsed.publishReason ?? "").trim();
      const merged = [strat, reason].filter(Boolean).join(" ");
      return merged.trim() || "Niş ve hedefe göre bu turda maksimum keşfedilebilirlik için seçildi.";
    })(),
  };
}

/** Liste görünümleri için kısa özet. */
export function summarizeCreativeForRows(payload: CreativeEnginePayload): string {
  const first = payload.viralIdeas[0] ?? payload.contentIdea;
  return first.slice(0, 80) + (first.length > 80 ? "…" : "");
}
