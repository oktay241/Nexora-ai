import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRow } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(): Promise<UserRow | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (error || !data) return null;
  return data as UserRow;
}

export async function getGrowthGoalKey(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Marka bilinirliği oluşturmak";

  const { data } = await supabase
    .from("growth_goals")
    .select("goal_key")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.goal_key as string | undefined) ?? "Marka bilinirliği oluşturmak";
}
