import type { SupabaseClient } from "@supabase/supabase-js";

import { getInstagramBusinessId } from "@/lib/data/social-accounts";
import { isInstagramProfessionalAccount } from "@/lib/integrations/meta/instagram-discovery";
import {
  createInstagramMediaContainer,
  publishInstagramMedia,
} from "@/lib/social-providers/meta-instagram-publisher";
import { logPublish, logPublishError } from "@/lib/logging/nexora-log";
import type { ConnectedSocialAccountRow } from "@/types/database";

export type InstagramPublishPipelineResult =
  | { ok: true; scheduledPostId: string; mediaId: string }
  | { ok: false; error: string; scheduledPostId?: string };

function buildCaption(caption: string, hashtags: string[]): string {
  const tags = hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
  const tail = tags.length ? `\n\n${tags}` : "";
  return `${caption.trim()}${tail}`.slice(0, 2200);
}

export async function publishGenerationToInstagram(input: {
  supabase: SupabaseClient;
  userId: string;
  generationId: string;
  socialAccount: ConnectedSocialAccountRow;
  caption: string;
  hashtags: string[];
  title: string;
}): Promise<InstagramPublishPipelineResult> {
  if (!isInstagramProfessionalAccount(input.socialAccount.account_type)) {
    return {
      ok: false,
      error:
        "Instagram Professional account required for AI autopilot publishing.",
    };
  }

  const igBizId = getInstagramBusinessId(input.socialAccount);
  if (!igBizId || !input.socialAccount.access_token) {
    return { ok: false, error: "Instagram Business hesabı veya erişim tokenı eksik." };
  }

  const { data: creative } = await input.supabase
    .from("ai_creatives")
    .select("storage_path")
    .eq("ai_generation_id", input.generationId)
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!creative?.storage_path) {
    return { ok: false, error: "Yayın için AI görseli bulunamadı." };
  }

  const { data: signed, error: signErr } = await input.supabase.storage
    .from("ai-creatives")
    .createSignedUrl(creative.storage_path as string, 7200);

  if (signErr || !signed?.signedUrl) {
    return { ok: false, error: signErr?.message ?? "Görsel URL oluşturulamadı." };
  }

  const caption = buildCaption(input.caption, input.hashtags);
  const scheduledFor = new Date().toISOString();

  const { data: postRow, error: insErr } = await input.supabase
    .from("scheduled_posts")
    .insert({
      user_id: input.userId,
      platform: "instagram",
      title: input.title.slice(0, 180) || "Nexora AI yayını",
      body_preview: input.caption.slice(0, 280),
      scheduled_for: scheduledFor,
      status: "scheduled",
      source_ai_generation_id: input.generationId,
      generation_id: input.generationId,
      image_url: signed.signedUrl,
      caption,
      publish_status: "queued",
    })
    .select("id")
    .single();

  if (insErr || !postRow?.id) {
    return { ok: false, error: insErr?.message ?? "Planlı yayın kaydı oluşturulamadı." };
  }

  const postId = postRow.id as string;

  await input.supabase
    .from("scheduled_posts")
    .update({ publish_status: "publishing" })
    .eq("id", postId)
    .eq("user_id", input.userId);

  const container = await createInstagramMediaContainer({
    instagramBusinessId: igBizId,
    imageUrl: signed.signedUrl,
    caption,
    accessToken: input.socialAccount.access_token,
  });

  if (!container.ok) {
    await input.supabase
      .from("scheduled_posts")
      .update({ publish_status: "failed", publish_error: container.error })
      .eq("id", postId)
      .eq("user_id", input.userId);
    await input.supabase
      .from("connected_social_accounts")
      .update({ last_publish_status: "failed" })
      .eq("user_id", input.userId)
      .eq("platform", "instagram");
    logPublishError("instagram_container_failed", { postId, error: container.error });
    return { ok: false, error: container.error, scheduledPostId: postId };
  }

  const published = await publishInstagramMedia({
    instagramBusinessId: igBizId,
    creationId: container.creationId,
    accessToken: input.socialAccount.access_token,
  });

  if (!published.ok) {
    await input.supabase
      .from("scheduled_posts")
      .update({ publish_status: "failed", publish_error: published.error })
      .eq("id", postId)
      .eq("user_id", input.userId);
    await input.supabase
      .from("connected_social_accounts")
      .update({ last_publish_status: "failed" })
      .eq("user_id", input.userId)
      .eq("platform", "instagram");
    logPublishError("instagram_publish_failed", { postId, error: published.error });
    return { ok: false, error: published.error, scheduledPostId: postId };
  }

  const publishedAt = new Date().toISOString();
  await input.supabase
    .from("scheduled_posts")
    .update({
      publish_status: "published",
      instagram_media_id: published.mediaId,
      published_at: publishedAt,
      publish_error: null,
    })
    .eq("id", postId)
    .eq("user_id", input.userId);

  await input.supabase
    .from("connected_social_accounts")
    .update({
      last_publish_at: publishedAt,
      last_publish_status: "published",
    })
    .eq("user_id", input.userId)
    .eq("platform", "instagram");

  logPublish("instagram_publish_success", {
    userId: input.userId,
    generationId: input.generationId,
    mediaId: published.mediaId,
    postId,
  });

  return { ok: true, scheduledPostId: postId, mediaId: published.mediaId };
}
