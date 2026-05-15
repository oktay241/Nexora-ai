"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import { completeOnboardingSetup } from "@/actions/onboarding";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GOAL_OPTIONS } from "@/lib/onboarding/persona";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";
import { cn } from "@/lib/utils";

const MODE_STEP = ONBOARDING_STEPS[0];

export function OnboardingForm() {
  const router = useRouter();
  const [usageMode, setUsageMode] = useState<"full_auto" | "approval_required" | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = Boolean(usageMode && goal);
  const progressPercent = canContinue ? 100 : 50;

  async function handleContinue() {
    if (!usageMode || !goal) return;
    setError(null);
    setBusy(true);
    try {
      const result = await completeOnboardingSetup(usageMode, goal);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Ana sayfa
          </Link>
        </Button>
        <Badge variant="outline" className="gap-1.5 border-violet-500/20">
          <Sparkles className="h-3 w-3 text-violet-300" />
          Growth operatörü
        </Badge>
      </div>

      <OnboardingStepper progressPercent={progressPercent} />

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="border-white/10 bg-white/[0.02] shadow-glow backdrop-blur-md">
          <CardContent className="space-y-8 p-6 sm:p-8">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {MODE_STEP.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Nexora’yı nasıl kullanacağınızı seçin. Instagram ve diğer bağlantıları dashboard’dan
                yapabilirsiniz.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setUsageMode("full_auto")}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left text-sm transition-all",
                  usageMode === "full_auto"
                    ? "border-violet-500/50 bg-violet-500/10 shadow-glow"
                    : "border-white/10 bg-black/30 hover:border-white/20",
                )}
              >
                <span className="font-medium">Tam Otomatik</span>
                <span className="text-xs text-muted-foreground">
                  AI içerik üretir; bağlı Instagram’da otonom yayın (Professional hesap gerekir).
                </span>
                {usageMode === "full_auto" ? (
                  <Check className="ml-auto h-4 w-4 text-violet-200" />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setUsageMode("approval_required")}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left text-sm transition-all",
                  usageMode === "approval_required"
                    ? "border-violet-500/50 bg-violet-500/10 shadow-glow"
                    : "border-white/10 bg-black/30 hover:border-white/20",
                )}
              >
                <span className="font-medium">Onaylı Mod</span>
                <span className="text-xs text-muted-foreground">
                  AI üretir; yayın öncesi siz onaylarsınız.
                </span>
                {usageMode === "approval_required" ? (
                  <Check className="ml-auto h-4 w-4 text-violet-200" />
                ) : null}
              </button>
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold">Büyüme hedefi</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Üretim önceliği seçtiğiniz hedefe göre ayarlanır.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all",
                      goal === g
                        ? "border-violet-500/50 bg-violet-500/10 shadow-glow"
                        : "border-white/10 bg-black/30 hover:border-white/20",
                    )}
                  >
                    {g}
                    {goal === g ? <Check className="h-4 w-4 text-violet-200" /> : null}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
        <Button
          size="lg"
          className="gap-2 shadow-glow"
          disabled={!canContinue || busy}
          onClick={() => void handleContinue()}
        >
          {busy ? "Kaydediliyor…" : "Devam"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
