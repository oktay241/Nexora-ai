"use server";

import { revalidatePath } from "next/cache";

import { attachCreativeVisualToGeneration } from "@/lib/creative/attach-creative-visual";
import { buildOperatorContextBlock } from "@/lib/operator/build-operator-context";
import { mergeDiscoveryProfile } from "@/lib/openai/discovery-engine";
import { mergeGrowthStrategy } from "@/lib/openai/growth-strategy-engine";
import { generateCreativeEngine } from "@/lib/openai/creative-engine";
import { getOpenAIModel } from "@/lib/env";
import { normalizePersona, type UserPersona } from "@/lib/onboarding/persona";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CreativePackGenState = { error?: string; ok?: boolean };

export async function generateNewCreativePack(
  _prev: CreativePackGenState | undefined,
  _formData: FormData,
): Promise<CreativePackGenState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data: profile, error: pErr } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (pErr || !profile) return { error: "Profil okunamadı." };

  const { data: goalRow } = await supabase
    .from("growth_goals")
    .select("goal_key")
    .eq("user_id", user.id)
    .maybeSingle();
  const goal = (goalRow?.goal_key as string | undefined) ?? "Marka bilinirliği oluşturmak";

  const persona = normalizePersona(profile.persona as string | null) as UserPersona;
  const discovery = mergeDiscoveryProfile(profile.discovery_profile);
  const growth = mergeGrowthStrategy(profile.growth_strategy);

  const block = buildOperatorContextBlock(persona, discovery, profile.growth_strategy, {
    goal,
    usageMode: String(profile.usage_mode ?? "approval_required"),
    instagram: String(profile.instagram_profile_input ?? ""),
    tiktok: String(profile.tiktok_profile_input ?? ""),
    bioNote: String(profile.profile_bio_note ?? ""),
  });

  let ai: Awaited<ReturnType<typeof generateCreativeEngine>>;
  try {
    ai = await generateCreativeEngine({
      persona,
      goal,
      contextBlock: block,
      imageSignedUrl: null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Creative Engine başarısız." };
  }

  const { data: genRow, error: gErr } = await supabase
    .from("ai_generations")
    .insert({
      user_id: user.id,
      goal,
      product_description: block.slice(0, 4000),
      product_image_path: null,
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

  if (gErr || !genRow?.id) return { error: gErr?.message ?? "Kayıt oluşturulamadı." };

  const vis = await attachCreativeVisualToGeneration({
    supabase,
    userId: user.id,
    generationId: genRow.id as string,
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
      error: `Creative metin paketi kaydedildi; görsel pipeline başarısız (${vis.phase}): ${vis.message}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ai-content");
  revalidatePath("/dashboard/scheduling");
  return { ok: true };
}
