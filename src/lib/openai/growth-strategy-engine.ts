import OpenAI from "openai";

import type { DiscoveryProfile, GrowthStrategyPayload } from "@/lib/operator/discovery-types";
import { getOpenAIApiKey, getOpenAIModel } from "@/lib/env";

const SYSTEM = `Sen "Nexora AI Growth Strategy" modülüsün — discovery çıktısına göre uygulanabilir Türkçe strateji üretirsin.
Yanıtı YALNIZCA geçerli bir JSON nesnesi olarak ver; başka metin ekleme.
Analyze → Learn → Generate → Optimize döngüsünü strateji dilinde yansıt (Publish/Measure API olmadan plan diliyle).`;

function arr(k: string, o: Record<string, unknown>, max = 8): string[] {
  const v = o[k];
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).map((x) => String(x).trim()).filter(Boolean).slice(0, max);
}

export function mergeGrowthStrategy(raw: unknown): GrowthStrategyPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const loop = String(o.operator_loop_summary ?? "").trim();
  const summary = String(o.strategy_summary ?? "").trim();
  if (!loop && !summary) return null;

  const pillars = arr("content_pillars", o, 8);
  const bestTypes = arr("best_content_types", o, 8);
  const viralHooks = arr("viral_hook_strategy", o, 8);
  const times = arr("best_posting_times", o, 8);

  return {
    strategy_summary: summary || loop.slice(0, 280),
    posting_frequency: String(o.posting_frequency ?? "").trim() || "Haftalık ritim planlanıyor.",
    best_content_types: bestTypes.length ? bestTypes : ["Reels", "Carousel"],
    recommended_hook_style:
      String(o.recommended_hook_style ?? "").trim() || "Thumb-stop soru + hızlı tepe",
    viral_hook_strategy: viralHooks.length
      ? viralHooks
      : [String(o.recommended_hook_style ?? "Kontrastlı açılış").trim()],
    platform_strategy: String(o.platform_strategy ?? "").trim() || "Instagram keşfet + TikTok FYP",
    viral_content_structure:
      String(o.viral_content_structure ?? "").trim() || "Hook 1sn → değer 12sn → CTA 3sn",
    content_pillars: pillars.length ? pillars : ["Güven", "Eğlence", "Dönüşüm"],
    best_posting_times: times.length
      ? times
      : ["Ha içi 12:00–14:00", "Akşam 19:00–22:00", "Hafta sonu 10:00–12:00"],
    engagement_optimization:
      String(o.engagement_optimization ?? "").trim() ||
      "İlk yorumu sabitleme, CTA çeşitlendirme, seri içerik (hook tekrarı yok).",
    operator_loop_summary:
      loop ||
      "Analiz → öğren → üret → optimize et; yayın ve ölçüm API ile tamamlanacak.",
    next_experiment_hook: String(o.next_experiment_hook ?? "").trim() || "İlk 2 saniyede merak uyandıran soru.",
    why_this_direction:
      String(o.why_this_direction ?? "").trim() ||
      "Hedef ve niş ile uyumlu içerik miks'i maksimize eder.",
  };
}

export async function generateGrowthStrategy(input: {
  goal: string;
  usageMode: string;
  discovery: DiscoveryProfile;
}): Promise<GrowthStrategyPayload> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY tanımlı değil.");

  const openai = new OpenAI({ apiKey });
  const model = getOpenAIModel();

  const userText = `Hedef: ${input.goal}
Kullanım modu: ${input.usageMode}

Discovery:
${JSON.stringify(input.discovery, null, 2)}

Üretilecek JSON şeması:
{
  "strategy_summary": "string — 2-4 cümle AI strateji özeti (dashboard)",
  "posting_frequency": "string",
  "best_content_types": ["string", ...],
  "recommended_hook_style": "string",
  "viral_hook_strategy": ["string", ...],
  "platform_strategy": "string",
  "viral_content_structure": "string",
  "content_pillars": ["string", ...],
  "best_posting_times": ["string", ...],
  "engagement_optimization": "string",
  "operator_loop_summary": "string — Analyze → Learn → Generate → Optimize",
  "next_experiment_hook": "string",
  "why_this_direction": "string"
}`;

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userText },
    ],
    temperature: 0.72,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI yanıtı boş.");

  const merged = mergeGrowthStrategy(JSON.parse(raw) as Record<string, unknown>);
  if (!merged) throw new Error("Strateji çıktısı geçersiz.");
  return merged;
}
