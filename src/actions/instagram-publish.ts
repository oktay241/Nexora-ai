"use server";

import { revalidatePath } from "next/cache";

import { getConnectedSocialAccount, getInstagramBusinessId } from "@/lib/data/social-accounts";
import { publishGenerationToInstagram } from "@/lib/integrations/meta/instagram-publish-pipeline";
import { logPublishWarn } from "@/lib/logging/nexora-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ConnectedSocialAccountRow } from "@/types/database";

export type InstagramPublishActionState = { ok?: boolean; error?: string; mediaId?: string };

export async function publishInstagramTestPostAction(
  _prev: InstagramPublishActionState | undefined,
  _formData: FormData,
): Promise<InstagramPublishActionState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const social = await getConnectedSocialAccount("instagram");
  if (!social || !getInstagramBusinessId(social) || !social.access_token) {
    return { error: "Önce Instagram hesabını bağlayın." };
  }

  const { data: gen } = await supabase
    .from("ai_generations")
    .select("id, caption, hashtags, content_idea")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!gen?.id) {
    return { error: "Test yayını için önce AI içerik üretin." };
  }

  const hashtags = (gen.hashtags as string[] | null) ?? [];
  const result = await publishGenerationToInstagram({
    supabase,
    userId: user.id,
    generationId: gen.id as string,
    socialAccount: social,
    caption: String(gen.caption ?? "Nexora AI test yayını"),
    hashtags,
    title: String(gen.content_idea ?? "Nexora AI test post"),
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/social");
  revalidatePath("/dashboard/scheduling");
  return { ok: true, mediaId: result.mediaId };
}

export async function tryAutopilotInstagramPublishAfterGeneration(input: {
  userId: string;
  generationId: string;
  usageMode: string | null;
  caption: string;
  hashtags: string[];
  title: string;
}): Promise<void> {
  if (input.usageMode !== "full_auto") return;

  const supabase = await createServerSupabaseClient();
  const { data: social } = await supabase
    .from("connected_social_accounts")
    .select("*")
    .eq("user_id", input.userId)
    .eq("platform", "instagram")
    .maybeSingle();

  const row = social as ConnectedSocialAccountRow | null;
  if (!row || !getInstagramBusinessId(row) || !row.access_token) return;

  const result = await publishGenerationToInstagram({
    supabase,
    userId: input.userId,
    generationId: input.generationId,
    socialAccount: row,
    caption: input.caption,
    hashtags: input.hashtags,
    title: input.title,
  });

  if (!result.ok) {
    logPublishWarn("autopilot_publish_failed", { error: result.error, userId: input.userId });
  }
}
