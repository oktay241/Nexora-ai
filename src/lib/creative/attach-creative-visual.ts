import type { SupabaseClient } from "@supabase/supabase-js";

import type { DiscoveryProfile } from "@/lib/operator/discovery-types";
import type { CreativeEnginePayload } from "@/lib/openai/creative-engine";
import { buildFallbackImagePrompt, generateCreativeImagePng } from "@/lib/openai/generate-creative-image";
import { logImagePipeline } from "@/lib/openai/image-pipeline-log";
import { getOpenAIImageModel } from "@/lib/env";

type ProfileFallback = {
  content_niche?: string | null;
  content_tone?: string | null;
  persona?: string | null;
};

export type AttachCreativeVisualMode = "strict" | "best_effort";

export type AttachCreativeVisualResult =
  | { ok: true; storagePath: string; signedUrlOk: boolean }
  | { ok: false; phase: "generate" | "upload" | "db" | "signed_url"; message: string };

/**
 * Creative Engine çıktısından görsel üretir, ai-creatives bucket'a yükler, ai_creatives satırı ekler.
 * - strict: görsel / yükleme / DB / signed URL doğrulaması başarısızsa `ok: false` (UI hata gösterir).
 * - best_effort: onboarding vb. akışta metin kaydı korunur; hata yine `ok: false` ile loglanır.
 */
export async function attachCreativeVisualToGeneration(input: {
  supabase: SupabaseClient;
  userId: string;
  generationId: string;
  ai: CreativeEnginePayload;
  discovery: DiscoveryProfile | null;
  profile: ProfileFallback;
  mode?: AttachCreativeVisualMode;
}): Promise<AttachCreativeVisualResult> {
  const mode = input.mode ?? "strict";
  const imageModel = getOpenAIImageModel();

  const promptEn =
    input.ai.imageVisualBrief.trim() ||
    buildFallbackImagePrompt({
      niche: input.discovery?.niche ?? input.profile.content_niche ?? "brand growth",
      tone: input.discovery?.tone ?? input.profile.content_tone ?? "bold",
      accountType: input.discovery?.account_type ?? "Creator",
      formats: input.discovery?.content_formats ?? ["cinematic"],
    });

  logImagePipeline("info", "attach_pipeline_start", {
    mode,
    imageModel,
    generationId: input.generationId,
    userId: input.userId,
  });

  let png: Buffer;
  try {
    png = await generateCreativeImagePng(promptEn);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Görsel API hatası";
    return { ok: false, phase: "generate", message };
  }

  const path = `${input.userId}/${input.generationId}-${Date.now()}.png`;
  const { error: upErr } = await input.supabase.storage.from("ai-creatives").upload(path, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (upErr) {
    logImagePipeline("error", "upload_failed", { path, message: upErr.message, mode });
    return { ok: false, phase: "upload", message: upErr.message };
  }
  logImagePipeline("info", "upload_success", { path, bytes: png.length });

  const { error: imgErr } = await input.supabase.from("ai_creatives").insert({
    user_id: input.userId,
    ai_generation_id: input.generationId,
    storage_path: path,
    prompt: promptEn.slice(0, 2000),
    style_preset: input.discovery?.account_type ?? input.profile.persona ?? null,
  });
  if (imgErr) {
    logImagePipeline("error", "db_insert_failed", { path, message: imgErr.message, mode });
    return { ok: false, phase: "db", message: imgErr.message };
  }
  logImagePipeline("info", "db_insert_success", { path, ai_generation_id: input.generationId });

  const { data: signed, error: signErr } = await input.supabase.storage
    .from("ai-creatives")
    .createSignedUrl(path, 120);
  if (signErr || !signed?.signedUrl) {
    const message = signErr?.message ?? "Signed URL oluşturulamadı.";
    logImagePipeline("error", "signed_url_failed", { path, message, mode });
    return { ok: false, phase: "signed_url", message };
  }
  logImagePipeline("info", "signed_url_created", { path, ttlSec: 120 });

  logImagePipeline("info", "attach_pipeline_complete", {
    mode,
    imageModel,
    generationId: input.generationId,
    storagePath: path,
  });

  return { ok: true, storagePath: path, signedUrlOk: true };
}
