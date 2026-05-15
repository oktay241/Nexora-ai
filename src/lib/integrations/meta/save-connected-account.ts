import type { SupabaseClient } from "@supabase/supabase-js";

import type { MetaInstagramAccount } from "@/lib/integrations/meta/oauth";

export async function saveInstagramConnectedAccount(input: {
  supabase: SupabaseClient;
  userId: string;
  instagram: MetaInstagramAccount | null;
  metaUserName: string | null;
}): Promise<{ error: string | null }> {
  const handle =
    input.instagram?.username ??
    (input.metaUserName ? input.metaUserName.replace(/\s+/g, "").toLowerCase() : null);

  const { error } = await input.supabase.from("connected_accounts").upsert(
    {
      user_id: input.userId,
      platform: "instagram",
      handle: handle ? handle.replace(/^@/, "") : null,
      status: "connected",
    },
    { onConflict: "user_id,platform" },
  );

  return { error: error?.message ?? null };
}
