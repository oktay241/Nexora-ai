"use server";

import { revalidatePath } from "next/cache";

import { getBufferAccessToken } from "@/lib/env";
import {
  bufferCreateCustomScheduledPost,
  bufferCreateQueuedPost,
  bufferFetchChannels,
  bufferFetchOrganizations,
} from "@/lib/integrations/buffer/operations";
import { bufferServiceToDisplayPlatform } from "@/lib/integrations/buffer/platform-map";
import { syncBufferPublishStatusesForUser } from "@/lib/integrations/buffer/sync-post-statuses";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SendCreativeToBufferState = { ok?: boolean; error?: string };

function buildPostText(caption: string, hashtags: string[]): string {
  const tags = (hashtags ?? []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
  const tail = tags.length ? `\n\n${tags}` : "";
  return `${caption.trim()}${tail}`.slice(0, 12000);
}

async function resolveChannelService(
  accessToken: string,
  channelId: string,
): Promise<{ service: string; error: string | null }> {
  const orgs = await bufferFetchOrganizations(accessToken);
  if (orgs.error) return { service: "", error: orgs.error };
  const orgId = orgs.organizations[0]?.id;
  if (!orgId) return { service: "", error: "Yayın çalışma alanı bulunamadı." };
  const ch = await bufferFetchChannels(accessToken, orgId);
  if (ch.error) return { service: "", error: ch.error };
  const hit = ch.channels.find((c) => c.id === channelId);
  if (!hit) return { service: "", error: "Seçilen kanal yayın altyapısında bulunamadı." };
  return { service: hit.service, error: null };
}

/**
 * AI üretimini otonom yayın kuyruğuna veya özel zamanlamaya gönderir; yerelde `scheduled_posts` satırı oluşturur.
 * Yayın köprüsü hatası AI üretimini etkilemez (yalnızca bu aksiyonun sonucu).
 */
export async function sendCreativeGenerationToBuffer(
  _prev: SendCreativeToBufferState | undefined,
  formData: FormData,
): Promise<SendCreativeToBufferState> {
  const accessToken = getBufferAccessToken();
  if (!accessToken) return { error: "Otonom yayın köprüsü sunucuda yapılandırılmamış." };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const generationId = String(formData.get("generation_id") ?? "").trim();
  const channelId = String(formData.get("channel_id") ?? "").trim();
  const mode = String(formData.get("mode") ?? "queue").trim() === "scheduled" ? "scheduled" : "queue";
  const dueRaw = String(formData.get("due_at") ?? "").trim();

  if (!generationId || !channelId) return { error: "Eksik parametre (generation / channel)." };

  const { data: gen, error: gErr } = await supabase
    .from("ai_generations")
    .select("id, user_id, caption, hashtags, content_idea, persona, creative_type")
    .eq("id", generationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (gErr || !gen) return { error: "AI üretimi bulunamadı veya erişim yok." };

  const caption = String(gen.caption ?? "");
  const hashtags = (gen.hashtags as string[] | null) ?? [];
  const text = buildPostText(caption, hashtags);

  let imageUrl: string | null = null;
  const { data: img } = await supabase
    .from("ai_creatives")
    .select("storage_path")
    .eq("ai_generation_id", generationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (img?.storage_path) {
    const { data: signed } = await supabase.storage
      .from("ai-creatives")
      .createSignedUrl(img.storage_path as string, 7200);
    if (signed?.signedUrl) imageUrl = signed.signedUrl;
  }

  const svc = await resolveChannelService(accessToken, channelId);
  if (svc.error) return { error: svc.error };

  let bufferPost:
    | {
        id: string;
        text: string;
        dueAt: string | null;
        status: string | null;
        channelId: string | null;
      }
    | null = null;
  let bufErr: string | null = null;

  if (mode === "scheduled") {
    const due = dueRaw ? new Date(dueRaw) : null;
    if (!due || Number.isNaN(due.getTime())) {
      return { error: "Geçerli bir yayın zamanı (due_at) gerekli." };
    }
    const r = await bufferCreateCustomScheduledPost({
      accessToken,
      text,
      channelId,
      dueAtIsoUtc: due.toISOString(),
      imageUrl,
    });
    bufferPost = r.post;
    bufErr = r.error;
  } else {
    const r = await bufferCreateQueuedPost({
      accessToken,
      text,
      channelId,
      imageUrl,
    });
    bufferPost = r.post;
    bufErr = r.error;
  }

  if (bufErr || !bufferPost) return { error: bufErr ?? "Yayın kuyruğuna alınamadı." };

  const titleBase = String(gen.content_idea ?? "").trim() || caption.slice(0, 90);
  const scheduledFor =
    bufferPost.dueAt && !Number.isNaN(new Date(bufferPost.dueAt).getTime())
      ? new Date(bufferPost.dueAt).toISOString()
      : new Date().toISOString();

  const { error: insErr } = await supabase.from("scheduled_posts").insert({
    user_id: user.id,
    platform: bufferServiceToDisplayPlatform(svc.service),
    title: titleBase.slice(0, 180) || "Otonom yayın",
    body_preview: caption.slice(0, 280),
    scheduled_for: scheduledFor,
    status: "scheduled",
    source_ai_generation_id: generationId,
    persona: gen.persona as string | null,
    creative_type: mode === "scheduled" ? "buffer_scheduled" : "buffer_queue",
    buffer_post_id: bufferPost.id,
    buffer_channel_id: channelId,
    publish_status: (bufferPost.status ?? "scheduled").toLowerCase(),
  });

  if (insErr) return { error: `Yayın oluşturuldu; yerel kayıt hatası: ${insErr.message}` };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scheduling");
  revalidatePath("/dashboard/ai-content");
  return { ok: true };
}

export async function refreshBufferPublishStatusesAction(): Promise<{
  ok?: boolean;
  error?: string;
  updated?: number;
}> {
  const accessToken = getBufferAccessToken();
  if (!accessToken) return { error: "Otonom yayın köprüsü sunucuda yapılandırılmamış." };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { updated, error } = await syncBufferPublishStatusesForUser({
    supabase,
    userId: user.id,
    accessToken,
    timeoutMs: 5000,
  });
  if (error) return { error };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scheduling");
  return { ok: true, updated };
}

/**
 * Mevcut planlı Nexora satırını otonom yayın hattına eşler (kuyruk / özel zaman).
 */
export async function sendScheduledPostToBuffer(
  _prev: SendCreativeToBufferState | undefined,
  formData: FormData,
): Promise<SendCreativeToBufferState> {
  const accessToken = getBufferAccessToken();
  if (!accessToken) return { error: "Otonom yayın köprüsü sunucuda yapılandırılmamış." };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const postId = String(formData.get("post_id") ?? "").trim();
  const channelId = String(formData.get("channel_id") ?? "").trim();
  const mode = String(formData.get("mode") ?? "queue").trim() === "scheduled" ? "scheduled" : "queue";
  const dueRaw = String(formData.get("due_at") ?? "").trim();

  if (!postId || !channelId) return { error: "Eksik parametre (post / channel)." };

  const { data: row, error: pErr } = await supabase
    .from("scheduled_posts")
    .select("id, user_id, platform, title, body_preview, scheduled_for, source_ai_generation_id, buffer_post_id")
    .eq("id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (pErr || !row) return { error: "Planlı yayın bulunamadı." };
  if (row.buffer_post_id) return { error: "Bu yayın zaten otonom yayın hattına bağlı." };

  const genId = row.source_ai_generation_id as string | null;
  if (!genId) return { error: "Bu yayın için AI üretim bağlantısı yok." };

  const { data: gen } = await supabase
    .from("ai_generations")
    .select("caption, hashtags")
    .eq("id", genId)
    .eq("user_id", user.id)
    .maybeSingle();

  const caption = String(gen?.caption ?? row.body_preview ?? "");
  const hashtags = (gen?.hashtags as string[] | null) ?? [];
  const text = buildPostText(caption, hashtags);

  let imageUrl: string | null = null;
  const { data: img } = await supabase
    .from("ai_creatives")
    .select("storage_path")
    .eq("ai_generation_id", genId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (img?.storage_path) {
    const { data: signed } = await supabase.storage
      .from("ai-creatives")
      .createSignedUrl(img.storage_path as string, 7200);
    if (signed?.signedUrl) imageUrl = signed.signedUrl;
  }

  const svc = await resolveChannelService(accessToken, channelId);
  if (svc.error) return { error: svc.error };

  let bufferPost: Awaited<ReturnType<typeof bufferCreateQueuedPost>>["post"];
  let bufErr: string | null = null;

  if (mode === "scheduled") {
    const dueIso = dueRaw ? new Date(dueRaw).toISOString() : new Date(row.scheduled_for as string).toISOString();
    if (Number.isNaN(new Date(dueIso).getTime())) return { error: "Geçersiz zaman." };
    const r = await bufferCreateCustomScheduledPost({
      accessToken,
      text,
      channelId,
      dueAtIsoUtc: dueIso,
      imageUrl,
    });
    bufferPost = r.post;
    bufErr = r.error;
  } else {
    const r = await bufferCreateQueuedPost({ accessToken, text, channelId, imageUrl });
    bufferPost = r.post;
    bufErr = r.error;
  }

  if (bufErr || !bufferPost) return { error: bufErr ?? "Yayın kuyruğuna alınamadı." };

  const scheduledFor =
    bufferPost.dueAt && !Number.isNaN(new Date(bufferPost.dueAt).getTime())
      ? new Date(bufferPost.dueAt).toISOString()
      : (row.scheduled_for as string);

  const { error: uErr } = await supabase
    .from("scheduled_posts")
    .update({
      buffer_post_id: bufferPost.id,
      buffer_channel_id: channelId,
      publish_status: (bufferPost.status ?? "scheduled").toLowerCase(),
      scheduled_for: scheduledFor,
      platform: bufferServiceToDisplayPlatform(svc.service),
      creative_type: mode === "scheduled" ? "buffer_scheduled" : "buffer_queue",
    })
    .eq("id", postId)
    .eq("user_id", user.id);

  if (uErr) return { error: `Yayın güncellendi; kayıt hatası: ${uErr.message}` };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scheduling");
  return { ok: true };
}

/** Nexora arayüzü — markasız yayın durumu yenileme (altyapı eş anlamlısı). */
export const syncPublishStatusesAction = refreshBufferPublishStatusesAction;
