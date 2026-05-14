import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const profile = await getUserProfile();
  if (!profile) {
    redirect("/login?next=/onboarding");
  }
  if (profile.onboarding_completed_at) {
    redirect("/dashboard");
  }
  return children;
}
