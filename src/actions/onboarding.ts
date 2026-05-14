"use server";

import { revalidatePath } from "next/cache";

import { attachCreativeVisualToGeneration } from "@/lib/creative/attach-creative-visual";
import { buildOperatorContextBlock } from "@/lib/operator/build-operator-context";
import { buildScheduledPostOperatorContext } from "@/lib/operator/build-scheduled-post-context";
import type { DiscoveryProfile, GrowthStrategyPayload, UsageMode } from "@/lib/operator/discovery-types";
import { mapAccountTypeToPersona } from "@/lib/operator/map-account-persona";
import { extractHandleFromInput } from "@/lib/operator/social-parse";
import { getOpenAIModel } from "@/lib/env";
import { GOAL_OPTIONS, normalizePersona, type UserPersona } from "@/lib/onboarding/persona";
import { generateCreativeEngine } from "@/lib/openai/creative-engine";
import type { CreativeEnginePayload } from "@/lib/openai/creative-engine";
import { generateDiscoveryProfile } from "@/lib/openai/discovery-engine";
import { generateGrowthStrategy } from "@/lib/openai/growth-strategy-engine";
import { logImagePipeline } from "@/lib/openai/image-pipeline-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function isDiscoveryReady(raw: unknown): raw is DiscoveryProfile {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  return Boolean(String(o.niche ?? "").trim() && String(o.account_type ?? "").trim());
}

function isGrowthReady(raw: unknown): raw is GrowthStrategyPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  const s = String(o.strategy_summary ?? "").trim();
  const loop = String(o.operator_loop_summary ?? "").trim();
  return Boolean(s || loop);
}

export async function saveUsageModeAndGoal(
  usageMode: string,
  goalKey: string,
): Promise<{ error?: string }> {
  if (usageMode !== "full_auto" && usageMode !== "approval_required") {
    return { error: "Geçersiz kullanım modu." };
  }
  const allowed = new Set<string>(GOAL_OPTIONS as unknown as string[]);
  if (!allowed.has(goalKey)) return { error: "Geçersiz hedef." };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { error: uErr } = await supabase
    .from("users")
    .update({ usage_mode: usageMode })
    .eq("id", user.id);
  if (uErr) return { error: uErr.message };

  const { error: gErr } = await supabase.from("growth_goals").upsert(
    { user_id: user.id, goal_key: goalKey },
    { onConflict: "user_id" },
  );
  if (gErr) return { error: gErr.message };

  return {};
}

export async function saveOperatorSocial(input: {
  instagram: string;
  tiktok: string;
  bio: string;
}): Promise<{ error?: string }> {
  const ig = input.instagram.trim();
  const tt = input.tiktok.trim();
  if (!ig && !tt) return { error: "En az bir kanal (Instagram veya TikTok) girin." };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { error: uErr } = await supabase
    .from("users")
    .update({
      instagram_profile_input: ig || null,
      tiktok_profile_input: tt || null,
      profile_bio_note: input.bio.trim() || null,
    })
    .eq("id", user.id);
  if (uErr) return { error: uErr.message };

  const { error: delErr } = await supabase
    .from("connected_accounts")
    .delete()
    .eq("user_id", user.id);
  if (delErr) return { error: delErr.message };

  const rows: Array<{
    user_id: string;
    platform: "instagram" | "tiktok";
    status: string;
    handle: string | null;
  }> = [];

  if (ig) {
    const h = extractHandleFromInput(ig, "instagram");
    rows.push({ user_id: user.id, platform: "instagram", status: "connected", handle: h });
  }
  if (tt) {
    const h = extractHandleFromInput(tt, "tiktok");
    rows.push({ user_id: user.id, platform: "tiktok", status: "connected", handle: h });
  }

  if (rows.length) {
    const { error: caErr } = await supabase.from("connected_accounts").insert(rows);
    if (caErr) return { error: caErr.message };
  }

  return {};
}

export async function runDiscoveryOperator(): Promise<{
  error?: string;
  discovery?: DiscoveryProfile;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data: profile, error: pErr } = await supabase
    .from("users")
    .select(
      "instagram_profile_input, tiktok_profile_input, profile_bio_note, onboarding_completed_at",
    )
    .eq("id", user.id)
    .single();
  if (pErr || !profile) return { error: "Profil bulunamadı." };
  if (profile.onboarding_completed_at) return { error: "Kurulum tamamlanmış." };

  const { data: goalRow } = await supabase
    .from("growth_goals")
    .select("goal_key")
    .eq("user_id", user.id)
    .maybeSingle();
  const goal = goalRow?.goal_key ?? "Marka bilinirliği oluşturmak";

  const ig = String(profile.instagram_profile_input ?? "");
  const tt = String(profile.tiktok_profile_input ?? "");
  const bio = String(profile.profile_bio_note ?? "");
  if (!ig && !tt) return { error: "Önce sosyal kanal bilgilerini kaydedin." };

  let discovery: DiscoveryProfile;
  try {
    discovery = await generateDiscoveryProfile({
      goal,
      instagramInput: ig,
      tiktokInput: tt,
      bioNote: bio,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Discovery başarısız." };
  }

  const persona = mapAccountTypeToPersona(discovery.account_type);

  const { error: upErr } = await supabase
    .from("users")
    .update({
      discovery_profile: discovery as unknown as Record<string, unknown>,
      persona,
      content_niche: discovery.niche,
      content_tone: discovery.tone,
      target_audience: discovery.target_audience,
      onboarding_context: {
        operator_v1: true,
        discovery_account_type: discovery.account_type,
        discovery_formats: discovery.content_formats,
      },
    })
    .eq("id", user.id);
  if (upErr) return { error: upErr.message };

  return { discovery };
}

export async function runGrowthStrategyOperator(): Promise<{
  error?: string;
  growth?: GrowthStrategyPayload;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data: profile, error: pErr } = await supabase
    .from("users")
    .select("discovery_profile, usage_mode, onboarding_completed_at")
    .eq("id", user.id)
    .single();
  if (pErr || !profile) return { error: "Profil bulunamadı." };
  if (profile.onboarding_completed_at) return { error: "Kurulum tamamlanmış." };

  const raw = profile.discovery_profile as unknown;
  if (!isDiscoveryReady(raw)) return { error: "Önce Discovery Engine adımını tamamlayın." };
  const discovery = raw as DiscoveryProfile;

  const { data: goalRow } = await supabase
    .from("growth_goals")
    .select("goal_key")
    .eq("user_id", user.id)
    .maybeSingle();
  const goal = goalRow?.goal_key ?? "Marka bilinirliği oluşturmak";
  const usageMode = (profile.usage_mode as string | null) ?? "approval_required";

  let growth: GrowthStrategyPayload;
  try {
    growth = await generateGrowthStrategy({ goal, usageMode, discovery });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Strateji üretimi başarısız." };
  }

  const { error: upErr } = await supabase
    .from("users")
    .update({
      growth_strategy: growth as unknown as Record<string, unknown>,
      content_pillars: growth.content_pillars,
      viral_hooks: growth.viral_hook_strategy,
      ai_strategy: {
        version: "creative_growth_os_v1",
        stage: "growth_strategy",
        strategy_summary: growth.strategy_summary,
        pillars: growth.content_pillars,
        viral_hook_strategy: growth.viral_hook_strategy,
        updated_at: new Date().toISOString(),
      },
    })
    .eq("id", user.id);
  if (upErr) return { error: upErr.message };

  return { growth };
}

export async function finalizeOnboarding(): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data: profile, error: pErr } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (pErr || !profile) return { error: pErr?.message ?? "Profil bulunamadı." };
  if (profile.onboarding_completed_at) return { error: "Kurulum zaten tamamlanmış." };

  const discoveryRaw = profile.discovery_profile as unknown;
  const growthRaw = profile.growth_strategy as unknown;
  if (!isDiscoveryReady(discoveryRaw)) return { error: "Discovery profili eksik." };
  if (!isGrowthReady(growthRaw)) return { error: "Growth stratejisi eksik." };

  const discovery = discoveryRaw as DiscoveryProfile;
  const growth = growthRaw as GrowthStrategyPayload;

  const persona = normalizePersona(profile.persona as string | null) as UserPersona;

  const { data: goalRow } = await supabase
    .from("growth_goals")
    .select("goal_key")
    .eq("user_id", user.id)
    .maybeSingle();
  const goal = goalRow?.goal_key ?? "Marka bilinirliği oluşturmak";
  const usageMode = (profile.usage_mode as UsageMode | string | null) ?? "approval_required";

  const block = buildOperatorContextBlock(persona, discovery, growth, {
    goal,
    usageMode,
    instagram: String(profile.instagram_profile_input ?? ""),
    tiktok: String(profile.tiktok_profile_input ?? ""),
    bioNote: String(profile.profile_bio_note ?? ""),
  });

  const imagePath = (profile.product_image_path as string | null) ?? null;
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
      persona,
      goal,
      contextBlock: block,
      imageSignedUrl: signed,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI üretimi başarısız." };
  }

  const { data: genRow, error: gErr } = await supabase
    .from("ai_generations")
    .insert({
      user_id: user.id,
      goal,
      product_description: block.slice(0, 4000),
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

  if (gErr || !genRow) return { error: gErr?.message ?? "AI kaydı oluşturulamadı." };

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
    mode: "best_effort",
  });
  if (!vis.ok) {
    logImagePipeline("warn", "onboarding_image_skipped", {
      phase: vis.phase,
      message: vis.message,
    });
  }

  const { data: accounts } = await supabase
    .from("connected_accounts")
    .select("platform")
    .eq("user_id", user.id);

  type Plat = { platform: string };
  const list = (accounts ?? []) as Plat[];
  const normalized = list.map((a) => (a.platform === "tiktok" ? "tiktok" : "instagram"));
  const order: Array<"instagram" | "tiktok"> = [];
  if (normalized.includes("instagram")) order.push("instagram");
  if (normalized.includes("tiktok")) order.push("tiktok");
  if (order.length === 0) order.push("instagram", "tiktok");

  const now = new Date();
  const hookPreview = ai.viralHookPrimary || ai.hooks[0] || ai.caption;
  const pillars = growth.content_pillars.length ? growth.content_pillars : ["Yayın 1", "Yayın 2", "Yayın 3"];

  const mergedHooks: string[] = [];
  const hookSeen = new Set<string>();
  for (const h of [...growth.viral_hook_strategy, ...ai.hooks]) {
    const t = String(h).trim();
    if (!t || hookSeen.has(t)) continue;
    hookSeen.add(t);
    mergedHooks.push(t);
    if (mergedHooks.length >= 16) break;
  }

  const postsPayload: Array<{
    user_id: string;
    platform: string;
    title: string;
    body_preview: string;
    scheduled_for: string;
    status: string;
    source_ai_generation_id: string;
    persona: string;
    creative_type: string;
    operator_context: Record<string, unknown>;
  }> = [];

  for (let i = 0; i < 3; i++) {
    const plat = order[i % order.length]!;
    const pillarTitle = pillars[i] ?? `Operatör yayını ${i + 1}`;
    const platLabel = plat === "tiktok" ? "TikTok" : "Instagram";
    postsPayload.push({
      user_id: user.id,
      platform: platLabel,
      title: pillarTitle,
      body_preview: hookPreview.slice(0, 180),
      scheduled_for: new Date(now.getTime() + (i + 1) * 26 * 60 * 60 * 1000).toISOString(),
      status: "scheduled",
      source_ai_generation_id: genRow.id as string,
      persona,
      creative_type: "scheduled_hook",
      operator_context: buildScheduledPostOperatorContext({
        growth,
        pack: ai as CreativeEnginePayload,
        pillarLabel: pillarTitle,
        platform: platLabel,
      }),
    });
  }

  const { error: spErr } = await supabase.from("scheduled_posts").insert(postsPayload);
  if (spErr) return { error: spErr.message };

  const displayPlatforms = order.map((p) => (p === "tiktok" ? "TikTok" : "Instagram"));
  const uniq = Array.from(new Set(displayPlatforms));

  const analyticsRows: Array<{
    user_id: string;
    platform: string;
    metric_date: string;
    impressions: number;
    reach: number;
    engagements: number;
    followers: number;
  }> = [];

  for (let d = 6; d >= 0; d -= 1) {
    const dt = new Date(now);
    dt.setUTCDate(dt.getUTCDate() - d);
    const metric_date = dt.toISOString().slice(0, 10);
    const idx = 6 - d;
    for (const plat of uniq) {
      analyticsRows.push({
        user_id: user.id,
        platform: plat,
        metric_date,
        impressions: 1200 + idx * 180 + (plat === "TikTok" ? 220 : 0),
        reach: 800 + idx * 130,
        engagements: 40 + idx * 8,
        followers: 1500 + idx * 32,
      });
    }
  }

  const { error: aErr } = await supabase.from("analytics").upsert(analyticsRows, {
    onConflict: "user_id,platform,metric_date",
  });
  if (aErr) return { error: aErr.message };

  const { error: finErr } = await supabase
    .from("users")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      ai_strategy: {
        version: "creative_growth_os_v1",
        goal,
        persona,
        usage_mode: usageMode,
        generated_at: new Date().toISOString(),
        account_type: discovery.account_type,
        niche: discovery.niche,
        tone: discovery.tone,
        target_audience: discovery.target_audience,
        content_formats: discovery.content_formats,
        strategy_summary: growth.strategy_summary,
        posting_frequency: growth.posting_frequency,
        recommended_hook_style: growth.recommended_hook_style,
        summary_hook: hookPreview.slice(0, 240),
        operator_loop: growth.operator_loop_summary,
        next_experiment: growth.next_experiment_hook,
        engagement_optimization: growth.engagement_optimization,
        best_posting_times: growth.best_posting_times,
      },
      content_pillars: growth.content_pillars,
      viral_hooks: mergedHooks,
      target_platform: [String(profile.instagram_profile_input ?? ""), String(profile.tiktok_profile_input ?? "")]
        .filter(Boolean)
        .join(" · ") || discovery.content_formats.join(", "),
      brand_description: discovery.bio_analysis.slice(0, 2000),
    })
    .eq("id", user.id);
  if (finErr) return { error: finErr.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scheduling");
  revalidatePath("/onboarding");
  return {};
}

/** Eski istemciler için no-op uyumluluk (kullanılmıyor). */
export async function savePersona(persona: string): Promise<{ error?: string }> {
  if (!["creator", "ecommerce", "personal_brand", "business"].includes(persona)) {
    return { error: "Geçersiz kullanıcı tipi." };
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };
  const { error } = await supabase.from("users").update({ persona }).eq("id", user.id);
  if (error) return { error: error.message };
  return {};
}

export async function saveGrowthGoal(goalKey: string): Promise<{ error?: string }> {
  const allowed = new Set<string>(GOAL_OPTIONS as unknown as string[]);
  if (!allowed.has(goalKey)) return { error: "Geçersiz hedef." };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };
  const { error } = await supabase.from("growth_goals").upsert(
    { user_id: user.id, goal_key: goalKey },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  return {};
}

export async function saveOnboardingDetails(_formData: FormData): Promise<{ error?: string }> {
  return { error: "Bu kurulum akışı artık kullanılmıyor. Sayfayı yenileyin." };
}
