import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İlk kurulum",
  description:
    "Nexora YZ ile hedef, hesaplar ve ürün görseli adımlarını tamamlayın.",
};

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-50" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-sky-500/15 blur-[100px]" />
      <div className="pointer-events-none absolute inset-0 noise" />
      <div className="relative">
        <OnboardingFlow />
      </div>
    </div>
  );
}
