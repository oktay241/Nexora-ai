import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SchedulingAutomationCenter } from "@/components/dashboard/scheduling-automation-center";
import { listConnectedAccounts, listScheduledPostsWithAi } from "@/lib/data/dashboard";
import { loadBufferDashboardSnapshot } from "@/lib/integrations/buffer/dashboard-slice";
import { getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Otomatik paylaşım",
  description: "Planlanmış yayınlar",
};

export default async function SchedulingPage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login?next=/dashboard/scheduling");

  const [posts, accounts] = await Promise.all([
    listScheduledPostsWithAi({ syncBuffer: true }),
    listConnectedAccounts(),
  ]);
  const bufferSnap = await loadBufferDashboardSnapshot(posts);

  const userAiStrategy =
    profile.ai_strategy && typeof profile.ai_strategy === "object"
      ? (profile.ai_strategy as Record<string, unknown>)
      : null;

  const displayName =
    profile.full_name?.trim() ||
    profile.email?.split("@")[0]?.trim() ||
    "Nexora";

  const ig = accounts.find((a) => a.platform === "instagram")?.handle;
  const tt = accounts.find((a) => a.platform === "tiktok")?.handle;
  const instagramHandle = ig ? `@${String(ig).replace(/^@/, "")}` : "@nexora";
  const tiktokHandle = tt ? `@${String(tt).replace(/^@/, "")}` : "@nexora";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Otomatik paylaşım
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI Creative Engine ile üretilen içerikler Nexora planına ve otonom yayın kuyruğuna bağlanır;
          kartları açarak canlı sosyal önizleme, AI yayın hattı ve tam metni inceleyin.
        </p>
      </div>
      <SchedulingAutomationCenter
        posts={posts}
        userPersona={profile.persona}
        userAiStrategy={userAiStrategy}
        onboardingCompletedAt={profile.onboarding_completed_at}
        userDisplayName={displayName}
        instagramHandle={instagramHandle}
        tiktokHandle={tiktokHandle}
        buffer={bufferSnap}
      />
    </div>
  );
}
