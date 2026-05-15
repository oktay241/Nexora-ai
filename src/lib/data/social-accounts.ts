import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ConnectedSocialAccountRow } from "@/types/database";

export async function getConnectedSocialAccount(
  platform: "instagram" | "tiktok",
): Promise<ConnectedSocialAccountRow | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("connected_social_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", platform)
    .maybeSingle();

  if (error || !data) return null;
  return data as ConnectedSocialAccountRow;
}

export type InstagramPublishDashboardMeta = {
  account: ConnectedSocialAccountRow | null;
  lastPublishAt: string | null;
  lastPublishStatus: string | null;
  autopilotActive: boolean;
  professionalAccount: boolean;
};

export async function loadInstagramSocialDashboardMeta(
  usageMode: string | null,
): Promise<InstagramPublishDashboardMeta> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      account: null,
      lastPublishAt: null,
      lastPublishStatus: null,
      autopilotActive: false,
      professionalAccount: false,
    };
  }

  const { data: account } = await supabase
    .from("connected_social_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "instagram")
    .maybeSingle();

  const row = (account as ConnectedSocialAccountRow | null) ?? null;

  const { data: lastPost } = await supabase
    .from("scheduled_posts")
    .select("publish_status, published_at, updated_at")
    .eq("user_id", user.id)
    .eq("platform", "instagram")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const accountType = row?.account_type?.toUpperCase() ?? "";
  const professional =
    accountType === "BUSINESS" ||
    accountType === "MEDIA_CREATOR" ||
    accountType === "CREATOR" ||
    Boolean(row?.instagram_business_id);

  return {
    account: row,
    lastPublishAt:
      (lastPost?.published_at as string | null) ??
      (lastPost?.updated_at as string | null) ??
      null,
    lastPublishStatus: (lastPost?.publish_status as string | null) ?? null,
    autopilotActive: usageMode === "full_auto" && Boolean(row?.instagram_business_id),
    professionalAccount: professional,
  };
}
