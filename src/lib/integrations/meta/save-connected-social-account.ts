import type { SupabaseClient } from "@supabase/supabase-js";

import type { DiscoveredInstagramBusinessAccount } from "@/lib/integrations/meta/instagram-discovery";
import { expiresAtFromSeconds } from "@/lib/integrations/meta/long-lived-token";
import { logDbError, logMeta } from "@/lib/logging/nexora-log";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PersistInstagramResult =
  | { ok: true }
  | { ok: false; code: string; message: string; attempts: number };

export async function persistInstagramSocialAccount(input: {
  supabase: SupabaseClient;
  userId: string;
  discovered: DiscoveredInstagramBusinessAccount;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string | null;
}): Promise<PersistInstagramResult> {
  const expiresAt = expiresAtFromSeconds(input.expiresIn);
  const igUsername = input.discovered.username.replace(/^@/, "");
  const igBusinessId = input.discovered.instagramBusinessId;

  const socialPayload = {
    user_id: input.userId,
    platform: "instagram" as const,
    platform_user_id: input.discovered.metaUserId,
    username: igUsername,
    access_token: input.accessToken,
    refresh_token: input.refreshToken ?? null,
    expires_at: expiresAt,
    token_expires_at: expiresAt,
    token_type: input.tokenType,
    meta_page_id: input.discovered.metaPageId,
    instagram_business_id: igBusinessId,
    instagram_business_account_id: igBusinessId,
    account_type: input.discovered.accountType,
  };

  let socialLast: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error: socialErr } = await input.supabase
      .from("connected_social_accounts")
      .upsert(socialPayload, { onConflict: "user_id,platform" });

    if (!socialErr) {
      socialLast = null;
      break;
    }
    socialLast = socialErr.message;
    logMeta("retry_social_upsert", {
      attempt: attempt + 1,
      code: socialErr.code,
      message: socialErr.message,
    });
    if (attempt < 2) await delay(300 * (attempt + 1));
  }

  if (socialLast) {
    logDbError("connected_social_accounts upsert exhausted retries", { message: socialLast });
    return {
      ok: false,
      code: "social_upsert",
      message: socialLast,
      attempts: 3,
    };
  }

  let legacyLast: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error: legacyErr } = await input.supabase.from("connected_accounts").upsert(
      {
        user_id: input.userId,
        platform: "instagram",
        handle: igUsername,
        status: "connected",
      },
      { onConflict: "user_id,platform" },
    );

    if (!legacyErr) {
      legacyLast = null;
      break;
    }
    legacyLast = legacyErr.message;
    logMeta("retry_legacy_connected_accounts_upsert", {
      attempt: attempt + 1,
      code: legacyErr.code,
      message: legacyErr.message,
    });
    if (attempt < 2) await delay(300 * (attempt + 1));
  }

  if (legacyLast) {
    logDbError("connected_accounts upsert exhausted retries", { message: legacyLast });
    return {
      ok: false,
      code: "legacy_upsert",
      message: legacyLast,
      attempts: 3,
    };
  }

  return { ok: true };
}
