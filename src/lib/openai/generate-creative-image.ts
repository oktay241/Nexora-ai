import OpenAI from "openai";

import { getOpenAIApiKey, getOpenAIImageModel, getOpenAIImageQuality } from "@/lib/env";
import { logImagePipeline } from "@/lib/openai/image-pipeline-log";

const DEFAULT_VISUAL_SUFFIX =
  "Ultra premium social media post visual, cinematic lighting, futuristic dark UI accents, high-end commercial photography, shallow depth of field, 8k detail feel, square composition, no text, no watermark, no logos.";

type ImageRow = { b64_json?: string | null; url?: string | null };

function isGptImageModel(model: string): boolean {
  const m = model.toLowerCase();
  return m.startsWith("gpt-image") || m === "chatgpt-image-latest";
}

async function bufferFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Görsel URL indirilemedi (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

async function extractImageBytes(first: ImageRow | undefined, model: string): Promise<Buffer> {
  if (!first) {
    throw new Error("OpenAI Images: data[0] yok.");
  }
  if (first.b64_json && first.b64_json.length > 0) {
    return Buffer.from(first.b64_json, "base64");
  }
  if (first.url && first.url.length > 0) {
    logImagePipeline("info", "image_extraction_from_url", { model });
    return bufferFromUrl(first.url);
  }
  throw new Error(
    `OpenAI Images (${model}): yanıtta ne b64_json ne url var. Model çıktısı beklenen formatta değil.`,
  );
}

/** İngilizce prompt ile görsel üretir (OpenAI Images API — gpt-image-1; isteğe bağlı dall-e-2). */
export async function generateCreativeImagePng(promptEn: string): Promise<Buffer> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY tanımlı değil.");

  const model = getOpenAIImageModel();
  const openai = new OpenAI({ apiKey });
  const full = `${promptEn.trim()}\n\n${DEFAULT_VISUAL_SUFFIX}`;

  logImagePipeline("info", "generation_request", {
    model,
    promptChars: full.length,
  });

  try {
    if (isGptImageModel(model)) {
      const prompt = full.slice(0, 32000);
      const quality = getOpenAIImageQuality();

      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size: "1024x1024",
        output_format: "png",
        background: "opaque",
        quality,
        stream: false,
      });

      const first = response.data?.[0];
      const buffer = await extractImageBytes(first, model);

      logImagePipeline("info", "generation_success", {
        model,
        bytes: buffer.length,
        quality,
      });
      return buffer;
    }

    if (model === "dall-e-2") {
      const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: full.slice(0, 1000),
        n: 1,
        size: "1024x1024",
        response_format: "url",
      });
      const first = response.data?.[0];
      const buffer = await extractImageBytes(first, "dall-e-2");
      logImagePipeline("info", "generation_success", { model: "dall-e-2", bytes: buffer.length });
      return buffer;
    }

    throw new Error(
      `Desteklenmeyen OPENAI_IMAGE_MODEL: "${model}". Kullanın: gpt-image-1 (veya gpt-image-1-mini, gpt-image-1.5) veya dall-e-2.`,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logImagePipeline("error", "generation_failed", { model, message });
    throw e instanceof Error ? e : new Error(message);
  }
}

export function buildFallbackImagePrompt(input: {
  niche: string;
  tone: string;
  accountType: string;
  formats: string[];
}): string {
  const type = input.accountType.toLowerCase();
  let style = "sleek modern creator aesthetic with bold color accents";
  if (type.includes("saas")) style = "futuristic SaaS dashboard holographic gradients, deep blue and violet neon";
  if (type.includes("ecommerce") || type.includes("e-commerce")) style = "luxury product hero shot, marble and soft studio light, premium retail";
  if (type.includes("fitness") || input.niche.toLowerCase().includes("fitness"))
    style = "cinematic gym lighting, dramatic shadows, athletic energy";
  if (type.includes("creator")) style = "viral thumbnail energy, high contrast, expressive motion blur hints";
  if (type.includes("personal")) style = "authority personal brand, editorial portrait lighting, confident minimal composition";

  return `Subject: ${input.niche}. Mood: ${input.tone}. Formats inspiration: ${input.formats.slice(0, 4).join(", ")}. Style: ${style}.`;
}
