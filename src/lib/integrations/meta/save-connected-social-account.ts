import type { SupabaseClient } from "@supabase/supabase-js";

import type { DiscoveredInstagramBusinessAccount } from "@/lib/integrations/meta/instagram-discovery";
import { expiresAtFromSeconds } from "@/lib/integrations/meta/long-lived-token";

export async function persistInstagramSocialAccount(input: {
  supabase: SupabaseClient;
  userId: string;
  discovered: DiscoveredInstagramBusinessAccount;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string | null;
}): Promise<{ error: string | null }> {
  const expiresAt = expiresAtFromSeconds(input.expiresIn);

  const { error: socialErr } = await input.supabase.from("connected_social_accounts").upsert(
    {
      user_id: input.userId,
      platform: "instagram",
      platform_user_id: input.discovered.metaUserId,
      username: input.discovered.username.replace(/^@/, ""),
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      expires_at: expiresAt,
      token_type: input.tokenType,
      meta_page_id: input.discovered.metaPageId,
      instagram_business_id: input.discovered.instagramBusinessId,
      account_type: input.discovered.accountType,
    },
    { onConflict: "user_id,platform" },
  );

  if (socialErr) return { error: socialErr.message };

  const { error: legacyErr } = await input.supabase.from("connected_accounts").upsert(
    {
      user_id: input.userId,
      platform: "instagram",
      handle: input.discovered.username.replace(/^@/, ""),
      status: "connected",
    },
    { onConflict: "user_id,platform" },
  );

  return { error: legacyErr?.message ?? null };
}
