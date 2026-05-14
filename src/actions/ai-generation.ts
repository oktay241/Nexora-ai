"use server";

import { revalidatePath } from "next/cache";

import { attachCreativeVisualToGeneration } from "@/lib/creative/attach-creative-visual";
import { getOpenAIModel } from "@/lib/env";
import { buildOperatorContextBlock } from "@/lib/operator/build-operator-context";
import { buildAiContextBlock } from "@/lib/onboarding/build-ai-context";
import { normalizePersona, type OnboardingContext, type UserPersona } from "@/lib/onboarding/persona";
import { mergeDiscoveryProfile } from "@/lib/openai/discovery-engine";
import { generateCreativeEngine } from "@/lib/openai/creative-engine";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AiGenState = { error?: string; ok?: boolean };

export async function generateAiContentPack(
  _prev: AiGenState | undefined,
  formData: FormData,
): Promise<AiGenState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const description = String(formData.get("product_description") ?? "").trim();
  const file = formData.get("image");

  if (!description) return { error: "Bu tur için kısa bir talimat veya açıklama girin." };

  const { data: profile, error: pErr } = await supabase
    .from("users")
    .select(
      "persona, onboarding_context, product_image_path, discovery_profile, growth_strategy, usage_mode, instagram_profile_input, tiktok_profile_input, profile_bio_note, content_niche, content_tone",
    )
    .eq("id", user.id)
    .single();

  if (pErr || !profile) return { error: "Profil okunamadı." };

  const { data: goalRow } = await supabase
    .from("growth_goals")
    .select("goal_key")
    .eq("user_id", user.id)
    .maybeSingle();

  const goal = (goalRow?.goal_key as string | undefined) ?? "Marka bilinirliği oluşturmak";

  const persona = normalizePersona(profile.persona as string | null);
  const rawCtx = profile.onboarding_context as unknown;
  const baseCtx: OnboardingContext =
    rawCtx && typeof rawCtx === "object" && !Array.isArray(rawCtx)
      ? (Object.fromEntries(
          Object.entries(rawCtx as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v ?? "").trim(),
          ]),
        ) as OnboardingContext)
      : {};

  const ctx: OnboardingContext = {
    ...baseCtx,
    last_user_prompt: description,
  };

  const discovery = mergeDiscoveryProfile(profile.discovery_profile);
  const contextBlock = discovery
    ? buildOperatorContextBlock(persona, discovery, profile.growth_strategy, {
        goal: String(goal),
        usageMode: String(profile.usage_mode ?? "approval_required"),
        instagram: String(profile.instagram_profile_input ?? ""),
        tiktok: String(profile.tiktok_profile_input ?? ""),
        bioNote: String(profile.profile_bio_note ?? ""),
      })
    : buildAiContextBlock(persona as UserPersona, ctx);

  let imagePath: string | null = (profile.product_image_path as string | null) ?? null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) {
      return { error: "Görsel en fazla 8 MB olabilir." };
    }
    const safeName =
      file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "upload";
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (upErr) return { error: upErr.message };
    imagePath = path;
  }

  let signed: string | null = null;
  if (imagePath) {
    const { data: signedData, error: sErr } = await supabase.storage
      .from("product-images")
      .createSignedUrl(imagePath, 600);
    if (!sErr && signedData?.signedUrl) signed = signedData.signedUrl;
  }

  let ai: Awaited<ReturnType<typeof generateCreativeEngine>>;
  try {
    ai = await generateCreativeEngine({
      persona: persona as UserPersona,
      goal: String(goal),
      contextBlock,
      imageSignedUrl: signed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI üretimi başarısız.";
    return { error: msg };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("ai_generations")
    .insert({
      user_id: user.id,
      goal: String(goal),
      product_description: description,
      product_image_path: imagePath,
      caption: ai.caption,
      hashtags: ai.hashtags,
      content_idea: ai.contentIdea,
      short_video_idea: ai.shortVideoIdea,
      creative_pack: ai as unknown as Record<string, unknown>,
      persona,
      model: getOpenAIModel(),
      creative_type: "creative_engine_v1",
    })
    .select("id")
    .single();

  if (insErr || !inserted?.id) return { error: insErr?.message ?? "Kayıt oluşturulamadı." };

  const vis = await attachCreativeVisualToGeneration({
    supabase,
    userId: user.id,
    generationId: inserted.id as string,
    ai,
    discovery,
    profile: {
      content_niche: profile.content_niche as string | null,
      content_tone: profile.content_tone as string | null,
      persona: profile.persona as string | null,
    },
    mode: "strict",
  });
  if (!vis.ok) {
    return {
      error: `Metin paketi kaydedildi; AI görsel aşaması başarısız (${vis.phase}): ${vis.message}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ai-content");
  revalidatePath("/dashboard/scheduling");
  return { ok: true };
}
