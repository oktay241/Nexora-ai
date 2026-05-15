import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";

/** Yalnızca tek adım gösterilir — çoklu step bar yok. */
export function OnboardingStepper({ progressPercent }: { progressPercent: number }) {
  const step = ONBOARDING_STEPS[0];
  return (
    <div className="mb-8 space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="font-medium text-violet-200">1. {step.title}</span>
        <span className="text-foreground/80">Kurulum</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
