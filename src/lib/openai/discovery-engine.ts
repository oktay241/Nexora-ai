import OpenAI from "openai";

import type { DiscoveryProfile } from "@/lib/operator/discovery-types";
import { getOpenAIApiKey, getOpenAIModel } from "@/lib/env";

const SYSTEM = `Sen "Nexora AI Discovery Engine"sin — sosyal hesapları Türkçe analiz eden uzman.
Yanıtı YALNIZCA geçerli bir JSON nesnesi olarak ver; başka metin ekleme.
growth_score ve viral_potential 0-100 arası tam sayı; confidence 0-1 arası ondalık olabilir.
account_type şunlardan biri: "Creator", "SaaS", "Ecommerce", "Personal Brand", "Business".
content_formats dizisinde uygun etiketleri kullan: talking head, cinematic, meme, educational, faceless, UGC, storytelling.`;

function strArr(v: unknown, max = 12): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean).slice(0, max);
}

export function mergeDiscoveryProfile(raw: unknown): DiscoveryProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const niche = String(o.niche ?? "").trim();
  if (!niche) return null;
  const num = (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : d;
  };
  const formats = strArr(o.content_formats, 12);
  return {
    bio_analysis: String(o.bio_analysis ?? "").trim() || "Analiz üretilemedi.",
    profile_structure_summary:
      String(o.profile_structure_summary ?? "").trim() ||
      "Profil yapısı: metin girdilerinden çıkarıldı (MVP).",
    inferred_content_category: String(o.inferred_content_category ?? "").trim() || "Genel",
    account_type: String(o.account_type ?? "Creator").trim(),
    niche,
    tone: String(o.tone ?? "").trim() || "Dengeli",
    posting_style: String(o.posting_style ?? "").trim() || "Reels ve kısa form ağırlıklı varsayım.",
    target_audience: String(o.target_audience ?? "").trim() || "Geniş dijital kitle.",
    content_formats: formats.length ? formats : ["educational"],
    engagement_pattern_hint:
      String(o.engagement_pattern_hint ?? "").trim() || "Canlı API bağlanınca netleşecek.",
    growth_score: num(o.growth_score, 62),
    viral_potential: num(o.viral_potential, 55),
    confidence: Math.min(1, Math.max(0, Number(o.confidence) || 0.55)),
  };
}

export async function generateDiscoveryProfile(input: {
  goal: string;
  instagramInput: string;
  tiktokInput: string;
  bioNote: string;
}): Promise<DiscoveryProfile> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY tanımlı değil.");

  const openai = new OpenAI({ apiKey });
  const model = getOpenAIModel();

  const userText = `Kullanıcı büyüme hedefi: ${input.goal}

Instagram girdisi: ${input.instagramInput || "(yok)"}
TikTok girdisi: ${input.tiktokInput || "(yok)"}
Bio / profil özeti (kullanıcıdan): ${input.bioNote || "(yok — girdilere göre tahmin et)"}

Görev: Bio, profil yapısı, içerik kategorisi, paylaşım tarzı, hedef kitle ve içerik formatlarını analiz et.

JSON şeması:
{
  "bio_analysis": "string",
  "profile_structure_summary": "string — biyografi, linkler, CTA, highlight mantığı",
  "inferred_content_category": "string",
  "account_type": "string",
  "niche": "string",
  "tone": "string",
  "posting_style": "string — sıklık ve format karışımı tahmini",
  "target_audience": "string",
  "content_formats": ["string", ...],
  "engagement_pattern_hint": "string — kaydet / paylaş / yorum sinyali",
  "growth_score": 0,
  "viral_potential": 0,
  "confidence": 0.5
}`;

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userText },
    ],
    temperature: 0.65,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI yanıtı boş.");

  const parsed = mergeDiscoveryProfile(JSON.parse(raw) as Record<string, unknown>);
  if (!parsed) throw new Error("Discovery çıktısı geçersiz.");
  return parsed;
}
