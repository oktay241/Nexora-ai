"use server";

import { revalidatePath } from "next/cache";

import { GOAL_OPTIONS } from "@/lib/onboarding/persona";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Tek adımlı onboarding: kullanım modu + büyüme hedefi → tamamlandı işareti → dashboard.
 * Discovery / strateji / sosyal bağlantı dashboard’da yapılır.
 */
export async function completeOnboardingSetup(
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

  const { data: profile, error: pErr } = await supabase
    .from("users")
    .select("id, onboarding_completed_at, persona")
    .eq("id", user.id)
    .single();

  if (pErr || !profile) return { error: pErr?.message ?? "Profil bulunamadı." };
  if (profile.onboarding_completed_at) return { error: "Kurulum zaten tamamlanmış." };

  const completedAt = new Date().toISOString();
  const persona = (profile.persona as string | null) ?? "creator";

  const { error: uErr } = await supabase
    .from("users")
    .update({
      usage_mode: usageMode,
      onboarding_completed_at: completedAt,
      ai_strategy: {
        version: "onboarding_v2_minimal",
        goal: goalKey,
        persona,
        usage_mode: usageMode,
        generated_at: completedAt,
        summary_hook: "Dashboard’da Instagram bağlayın ve AI operatörünü başlatın.",
      },
    })
    .eq("id", user.id);

  if (uErr) return { error: uErr.message };

  const { error: gErr } = await supabase.from("growth_goals").upsert(
    { user_id: user.id, goal_key: goalKey },
    { onConflict: "user_id" },
  );
  if (gErr) return { error: gErr.message };

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return {};
}
